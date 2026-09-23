const test = require('node:test');
const assert = require('node:assert/strict');
const {assessAudit} = require('./audit-policy.cjs');

function result(counts = {}, status = 0) {
  const vulnerabilities = {info: 0, low: 0, moderate: 0, high: 0, critical: 0, ...counts};
  vulnerabilities.total = Object.values(vulnerabilities).reduce((sum, count) => sum + count, 0);
  return {status, stdout: JSON.stringify({auditReportVersion: 2, vulnerabilities: {}, metadata: {vulnerabilities}})};
}

test('취약점이 없고 명령이 성공해야 통과한다', () => assert.equal(assessAudit(result()).exitCode, 0));
test('중간 심각도를 보고하면서 높은 심각도 게이트와 구분한다', () => {
  const assessment = assessAudit(result({moderate: 3}));
  assert.equal(assessment.exitCode, 0);
  assert.equal(assessment.counts.moderate, 3);
  assert.match(assessment.reason, /남아/);
});
test('명령이 성공 코드여도 높은 심각도가 남으면 실패한다', () => assert.equal(assessAudit(result({high: 1})).exitCode, 1));
test('치명적인 취약점을 실패로 처리한다', () => assert.equal(assessAudit(result({critical: 1}, 1)).exitCode, 1));
test('취약점이 0이어도 명령 실패를 숨기지 않는다', () => assert.equal(assessAudit(result({}, 2)).exitCode, 1));
test('네트워크 오류 형식을 성공으로 처리하지 않는다', () => assert.equal(assessAudit({status: 1, stdout: '{"error":{"code":"ENETUNREACH"}}'}).exitCode, 1));
test('잘못된 JSON을 실패로 처리한다', () => assert.equal(assessAudit({status: 0, stdout: 'invalid'}).exitCode, 1));
test('명령 실행 오류와 시간 초과를 실패로 처리한다', () => assert.equal(assessAudit({...result(), error: new Error('timeout')}).exitCode, 1));
test('강제 종료를 실패로 처리한다', () => assert.equal(assessAudit({...result(), signal: 'SIGTERM'}).exitCode, 1));
test('합계가 맞지 않는 보고서를 실패로 처리한다', () => {
  const response = result();
  const report = JSON.parse(response.stdout);
  report.metadata.vulnerabilities.total = 10;
  response.stdout = JSON.stringify(report);
  assert.equal(assessAudit(response).exitCode, 1);
});
test('음수 개수와 누락된 필드를 실패로 처리한다', () => {
  assert.equal(assessAudit(result({high: -1})).exitCode, 1);
  const response = result();
  const report = JSON.parse(response.stdout);
  delete report.metadata.vulnerabilities.high;
  response.stdout = JSON.stringify(report);
  assert.equal(assessAudit(response).exitCode, 1);
});
