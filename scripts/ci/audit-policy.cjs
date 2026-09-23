const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const severities = ['info', 'low', 'moderate', 'high', 'critical'];

function assessAudit(result) {
  if (result.error || result.signal || !Number.isInteger(result.status)) {
    return {exitCode: 1, reason: '보안 검사 명령이 정상적으로 끝나지 않았습니다.'};
  }
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    return {exitCode: 1, reason: '보안 검사 보고서를 읽을 수 없습니다.'};
  }
  const counts = report?.metadata?.vulnerabilities;
  if (report.error || report.auditReportVersion !== 2 || !counts ||
      !severities.every(level => Number.isSafeInteger(counts[level]) && counts[level] >= 0) ||
      counts.total !== severities.reduce((sum, level) => sum + counts[level], 0) ||
      !report.vulnerabilities || typeof report.vulnerabilities !== 'object' ||
      Array.isArray(report.vulnerabilities)) {
    return {exitCode: 1, reason: '보안 검사 보고서가 예상한 형식과 다릅니다.'};
  }
  if (counts.high > 0 || counts.critical > 0) {
    return {exitCode: 1, counts, reason: '높은 심각도 또는 치명적인 취약점이 남아 있습니다.'};
  }
  // 취약점 개수가 0이어도 npm 자체 오류를 성공으로 바꾸지 않는다.
  if (result.status !== 0) {
    return {exitCode: 1, counts, reason: 'npm이 보안 검사를 성공으로 완료하지 못했습니다.'};
  }
  return {
    exitCode: 0,
    counts,
    reason: counts.total === 0
      ? '이번 npm 검사에서 알려진 취약점이 보고되지 않았습니다.'
      : '높은 심각도 게이트를 통과했습니다. 다른 심각도의 보고 항목은 남아 있습니다.',
  };
}

function main() {
  const result = spawnSync('npm', ['audit', '--json', '--audit-level=high'], {
    encoding: 'utf8', timeout: 120000, maxBuffer: 16 * 1024 * 1024,
  });
  const directory = process.env.AUDIT_REPORT_DIR || path.join(process.cwd(), 'build', 'audit');
  fs.mkdirSync(directory, {recursive: true});
  fs.writeFileSync(path.join(directory, 'npm-audit.json'), result.stdout || '');
  fs.writeFileSync(path.join(directory, 'npm-audit.stderr.txt'), result.stderr || '');
  const assessment = assessAudit(result);
  const lines = ['## 의존성 보안 검사', '', assessment.reason];
  if (assessment.counts) {
    lines.push('', '| 심각도 | 보고된 패키지 수 |', '| --- | ---: |');
    for (const severity of severities) {
      lines.push(`| ${severity} | ${assessment.counts[severity]} |`);
    }
  }
  lines.push('', '검사 범위는 개발 도구를 포함한 npm 의존성 전체입니다. 원문 보고서와 사용 경로를 함께 검토해야 합니다.',
    '이 결과는 iOS 네이티브 라이브러리, 개인정보 유출 여부 또는 실기기 동작을 검증하지 않습니다.', '');
  const summary = lines.join('\n');
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  }
  process.exitCode = assessment.exitCode;
}

module.exports = {assessAudit};
if (require.main === module) {
  main();
}
