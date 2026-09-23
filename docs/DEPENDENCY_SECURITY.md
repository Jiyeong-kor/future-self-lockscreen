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

## 2026-09-24 수정 및 검증

기존 main의 npm 보고에는 취약한 패키지 7개가 있었다. 중간 심각도 3개, 높은 심각도 4개였으며, 전이 의존성의 합계이지 서로 다른 취약점 7건이라는 뜻은 아니다.

수정 후보는 [검증 실행 35899427313](https://github.com/Jiyeong-kor/future-self-lockscreen/actions/runs/35899427313)에서 생성했다. 검증한 lockfile의 blob은 `85f972dd5280fc224e2caf390007f1a056d825e5`이다.

| 경로 | 수정 |
| --- | --- |
| React Navigation | `@react-navigation/core`를 7.21.13에서 7.22.1로 해석했다. 해당 버전은 query-string 의존성을 제거한다. |
| Metro | Metro 패키지 묶음을 0.87.0에서 0.87.1로 해석했다. 해당 버전은 취약한 image-size 1.2.1 경로를 제거한다. |
| 직접 의존성 | package.json을 바꾸지 않았다. React Native 0.87.0과 직접 의존성의 버전 및 선언 범위를 유지했다. |

단순 `npm audit fix`와 선택적 `npm update`만으로는 Metro 내부의 기존 고정 버전 묶음이 유지됐다. 따라서 임시 검증 작업 공간에서 Metro 패키지 묶음의 lock 항목을 재해석하고 npm이 선언된 의존성 범위에 따라 버전, 무결성 해시와 전이 의존성을 다시 계산하게 했다. 수동으로 다운로드 주소나 integrity를 만들어 넣지 않았다. 강제 업데이트, 메이저 변경, React Native 다운그레이드, 보안 예외는 사용하지 않았다.

새 lockfile에는 Metro가 사용하는 `flow-parser`와 `flow-estree` 0.331.0 등 전이 의존성 변경도 포함된다. npm이 산출한 전체 차이를 검토했다. 기존 package.json이 바뀌지 않았음은 검증 명령으로 확인했다.

검증 실행에서 npm ci, 감사 판정 테스트 11개, TypeScript, 앱 테스트 52개와 린트가 통과했다. 최종 `npm audit` JSON은 모든 심각도 0개를 보고했다. 이것은 그 시점의 npm 보고 결과이며, 네이티브 라이브러리나 개인정보 보호 전체의 안전을 보장하지 않는다.

최종 PR에는 위 lockfile과 감사 보고서 경계값 테스트를 반영한다. PR의 최종 커밋에 대한 재검사와 iOS 빌드는 별도로 확인하며, 검증 후보 생성에 사용한 임시 워크플로는 main이나 이 PR에 포함하지 않는다.

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
