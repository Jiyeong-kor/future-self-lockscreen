# iOS 런타임 검증

- 작성일: 2026-09-24
- 관련 문서: [개인 저장소 보호](IOS_PRIVATE_STORAGE.md), [CI 운영](CI_AND_IOS_VALIDATION.md)
- 구현 위치: PR #1 작업 브랜치. main 병합 및 검사 성공 여부는 PR과 해당 커밋의 CI를 확인한다.

## 이전 단계에서 확인한 사실

`d304c682a3da1fcdb93afffab428ebe07384a54d`의 CI 실행 `35910912119`은 전체 성공으로 완료됐다. 여기에는 TypeScript, Jest 107개, 감사 정책 테스트 13개, npm 감사와 iOS Debug 빌드가 포함된다. 이전 PR 설명에서 진행 중이던 iOS 빌드도 완료된 결과를 확인했다. 이것은 앱 실행 검증이 아니라 컴파일 및 링크 검증이었다.

## 이번 검증의 목적

컴파일이 성공해도 TurboModule의 런타임 등록, 실제 Keychain과 SQLCipher 초기화, 백그라운드 복귀 후 DB 재연결이 정상이라고 단정할 수 없다. 따라서 XCTest UI 테스트가 일반 앱 화면에서 직접 기록을 입력하고 저장하도록 한다. 저장소 대역, 보안 검사 생략, 테스트 전용 DB 경로 또는 제품 내부의 숨겨진 테스트 액션은 추가하지 않는다.

## 검증하는 사용자 흐름

| 테스트 | 판정 조건 |
| --- | --- |
| 저장 후 앱 프로세스 재시작 | 앱에서 가상 기록을 저장하고 앱을 종료한 뒤 다시 실행했을 때 같은 본문을 읽는다. |
| 작성 중 백그라운드 전환과 복귀 | 저장된 기록과 미저장 입력을 유지하고, 복귀 후 새 기록을 한 번 저장할 수 있다. |

고정된 데이터 개수나 기록 날짜를 가정하지 않도록 본문에는 가상 접두사와 UUID를 사용한다. 테스트는 사용자의 실제 경험과 개인정보를 포함하지 않는다. 자동 쓰기 재시도로 성공을 만들지 않으며, 실패를 건너뛰거나 통과로 바꾸지 않는다.

## 실행 구조

`ios/configure_runtime_tests.rb`는 기존 앱 스킴을 수정하지 않고 `FutureSelfUITests` 타깃과 `FutureSelfRuntime` 공유 스킴을 등록한다. 반복 실행 시 프로젝트와 스킴이 바뀌지 않는지 CI에서 비교한다. XCTest는 앱 외부의 테스트 프로세스에서 실행된다.

CI는 설치된 iOS 런타임과 호환되는 iPhone 기종을 조회한 뒤 이번 실행 전용 시뮬레이터를 새로 만든다. 기존 개발 기기와 사용자의 데이터는 삭제하지 않는다. 정리 단계에서는 이번 실행이 생성한 시뮬레이터 UUID만 삭제한다.

앱은 Release 구성으로 JS를 번들에 포함한다. Metro 서버 없이 실행하므로 번들 생성만 성공하고 실행 시 개발 서버를 찾는 경우를 검출한다. `build-for-testing` 이후 `test-without-building`으로 같은 빌드 산출물을 검사한다. 기존 독립 Debug 빌드 단계는 이 Release 빌드 및 실행 검사로 대체한다. 향후 Debug 전용 동작은 별도 점검한다.

개발자는 가상 데이터만 있는 시뮬레이터에서 다음 순서로 같은 테스트를 수행할 수 있다.

```sh
bundle exec pod install --project-directory=ios
bundle exec ruby ios/configure_runtime_tests.rb
xcodebuild -workspace ios/FutureSelf.xcworkspace -scheme FutureSelfRuntime \
  -configuration Release -destination 'platform=iOS Simulator,id=<가상 데이터 전용 기기 UUID>' \
  CODE_SIGNING_ALLOWED=NO test
```

## 산출물과 실패 처리

빌드 로그, UI 테스트 로그와 xcresult를 7일 동안 보존한다. CI 테스트용 화면 및 실패 스크린샷에는 가상 데이터만 들어간다. 실패 원인은 로그와 xcresult에서 확인하며 보안 속성 확인 실패를 우회해서 앱이 실행되게 만들지 않는다.

현재 파일에 적힌 테스트 개수는 테스트 정의의 개수이다. 실행 성공은 해당 커밋의 CI 결과와 각 테스트 결과로 확인한다. 로컬 Swift 구문 분석과 Ruby 구문 검사는 UIKit·XCTest 타입 검사나 시뮬레이터 실행을 대신하지 않는다.

## 남아 있는 실기기 검증

시뮬레이터의 성공만으로 실제 iPhone의 잠금 시 파일 접근 차단을 증명할 수는 없다. 서명된 앱의 Data Protection entitlement, 실제 키 잠금, DB/WAL/SHM 속성 및 자동 백업 제외, 잠금 중 쓰기와 롤백, 잠금 해제 후 복구, 앱 전환기 스냅샷과 VoiceOver는 실기기에서 별도로 확인한다. 이번 테스트는 OS 화면 잠금과 백그라운드 전환을 동일하게 취급하지 않는다.

참고: Apple XCUIApplication 문서와 CocoaPods Xcodeproj의 XCScheme 및 Project API를 기준으로 테스트와 타깃 구성을 작성했다.
