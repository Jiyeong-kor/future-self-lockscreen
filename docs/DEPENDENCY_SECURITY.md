# Future Self 의존성 보안 추적

- 갱신일: 2026-09-24
- 적용 범위: 개발 도구를 포함한 npm 의존성 전체
- 관련 문서: [CI 운영과 iOS 검증](CI_AND_IOS_VALIDATION.md), [현재 구현 상태](IMPLEMENTATION_STATUS.md)

## 현재 판정 원칙

일반 앱 테스트 통과, 의존성 취약점 검사 통과, 네이티브 빌드, 실기기 개인정보 보호 검증을 구분한다.

Dependency Audit의 기존 report-only 정책은 폐기한다. `continue-on-error`로 보안 실패를 성공 처리하지 않는다. 알려진 업스트림 취약점이라는 이유만으로 모든 새로운 취약점까지 통과시키지 않는다.

CI는 `npm audit --json --audit-level=high`를 실행하고 다음을 확인한다.

- 높은 심각도 또는 치명적인 취약점이 남으면 실패한다.
- npm 명령 실패, 네트워크 오류, 시간 초과, 손상되거나 알 수 없는 형식의 보고서도 실패한다.
- 낮은 심각도와 중간 심각도는 보고서 및 작업 요약에 보존한다.
- JSON 원문과 stderr를 7일 동안 CI 산출물로 보관한다. 앱의 개인 기록은 포함하지 않는다.
- 이 검사는 개발 도구까지 포함한다. production dependency 표시는 실제 앱에 포함되는 코드와 동일하지 않을 수 있으므로 도달 가능성은 별도로 분석한다.

검사 실패는 개인정보 유출이 확인됐다는 뜻이 아니다. 반대로 알려진 취약점이 없다는 결과도 보안 전체의 완료를 뜻하지 않는다.

## 기존 보고와 현재 재검토

2026-09-05에는 React Navigation의 query-string 및 decode-uri-component 경로, React Native/Metro의 image-size 경로가 보고됐다. 당시의 `수정 없음`이나 breaking downgrade 안내를 현재 상태로 단정하지 않는다.

2026-09-24에 확인한 직전 CI 설치 로그에서는 취약점 7개가 보고됐다. 중간 심각도 3개와 높은 심각도 4개였다. 이 합계만으로 취약 패키지, advisory, 수정 버전, 실제 앱 영향까지 확정하지 않는다. 이번 PR의 재검사 원문을 기준으로 다시 판단한다.

| 기존 경로 | 검토할 표면 |
| --- | --- |
| React Navigation / query-string / decode-uri-component | 외부 URL과 딥링크 입력의 사용 여부 |
| React Native / Metro / image-size | 개발·빌드 과정에서 처리하는 이미지 및 외부 입력 |

현재 제품에 경로가 노출되지 않더라도 취약점이 해결된 것은 아니다. 이미지 입력과 딥링크 기능을 추가하면 기존 완화 가정도 다시 확인한다.

## 수정 절차

1. 고정된 package-lock.json과 해당 커밋의 audit JSON을 함께 확인한다.
2. advisory, 직접·전이 의존성, 설치 버전, 패치 버전, 실제 호출 경로를 구분한다.
3. 호환 범위 수정안을 작업 브랜치에서 검토한다. `npm audit fix --dry-run --json` 결과도 근거로 활용할 수 있다.
4. 변경된 lockfile과 직접 의존성 차이를 확인하고 TypeScript, 테스트, lint, 보안 검사와 필요한 네이티브 빌드를 수행한다.
5. 통과한 변경만 검토 후 main에 병합한다. CI가 수정된 lockfile을 임의로 main에 커밋하지 않는다.

`npm audit fix --force`, 근거 없는 React Native downgrade, 검사 삭제, 무기한 포괄 예외로 통과시키지 않는다. 예외가 필요한 경우에는 advisory와 적용 버전, 근거, 영향 표면, 만료일을 특정한 별도 검토를 거친다. 이번 변경은 그러한 예외를 추가하지 않는다.

## 공개 배포 기준

공개 배포 전에는 npm 이외의 네이티브 의존성과 개인정보 보호도 검증한다. 미해결 보안 실패, 미확인 키 보호·파일 보호, 삭제 및 복원 정합성을 일반 CI 성공으로 대체하지 않는다.

참고: https://docs.npmjs.com/cli/v11/commands/npm-audit/
