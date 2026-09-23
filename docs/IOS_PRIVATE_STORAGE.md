# iOS 파일 보호와 잠금 상태 연결

- 작성일: 2026-09-24
- 적용 위치: PR #1 작업 브랜치
- 기존 기준: DATA_LIFECYCLE_SECURITY.md, DATABASE_SESSION_SAFETY.md

## 구현

기존 `Library/future-self.sqlite` 경로와 Keychain 서비스, SQL 스키마를 유지한다. DB를 이동하거나 기존 파일을 삭제하지 않는다. AI, 결제, 행동 입력 UI를 추가하지 않는다.

`NativePrivateStorage` TurboModule은 UIKit의 protected-data 알림과 백그라운드/활성화 알림을 감시한다. 파일 잠금 예고를 받으면 접근 상태를 즉시 비허용으로 바꾸며, OS가 잠금을 실제 적용하기 전 잠깐 true를 반환해도 해제 알림 전에는 허용하지 않는다. JS로 보내는 데이터는 허용 여부와 상태 세대 번호뿐이다. 개인 문장과 암호화 키는 보내지 않는다.

JS는 잠금 이벤트를 받으면 기존 DatabaseSession의 종료를 요청한다. 신규 접근뿐 아니라 대기 중 쿼리, 트랜잭션의 각 SQL과 커밋 직전에도 네이티브 상태 및 연결을 열었던 세대를 검사한다. 잠금과 해제가 모두 지나갔어도 이전 핸들은 재사용하지 않는다. 종료가 진행 중인 트랜잭션을 기다리는 동안 이벤트 콜백이 종료 Promise를 기다리지 않도록 하여 교착을 피한다. 롤백과 원시 핸들 정리는 차단하지 않는다.

잠금 때문에 실패한 쿼리를 자동으로 재전송하지 않는다. 이 정책은 중복 저장 방지를 위한 것이다. 사용자는 잠금을 해제한 뒤 기존 화면에서 다시 저장할 수 있다. 저장 화면의 입력 보존 정책은 유지한다.

## 파일 보호

DB 연결 전과 WAL 설정 후, migration 완료 후에 다음 고정 파일을 확인한다.

- future-self.sqlite
- future-self.sqlite-wal
- future-self.sqlite-shm
- future-self.sqlite-journal

존재하는 파일에 `NSFileProtectionComplete`와 `NSURLIsExcludedFromBackupKey`를 적용하고 다시 읽어 확인한다. 설정 또는 확인이 실패하면 연결을 제공하지 않는다. 심볼릭 링크와 디렉터리는 거부한다. 본체가 없고 보조 파일만 남아 있다면 복구 필요 오류를 반환하며 빈 DB를 새로 만들지 않는다. 완전히 신규인 경우에만 덮어쓰기 금지 옵션과 Complete 속성으로 빈 본체 파일을 만든다.

`FutureSelf.entitlements`에 기본 Data Protection을 Complete로 지정한다. 이는 새로 만들어지는 보조 파일의 기본 보호를 위한 설정이다. 실제 기기의 서명 및 provisioning profile에 entitlement가 포함됐는지 확인해야 한다. 코드에 파일이 존재하거나 Simulator 빌드가 성공했다는 것만으로 entitlement의 기기 적용을 증명할 수 없다.

OS 백업 제외 플래그는 앱이 관리하는 위 파일에만 설정한다. Library 전체나 다른 앱의 데이터를 제외하지 않는다. 이미 만들어진 외부 백업을 삭제하는 기능은 아니다. 재생성되는 보조 파일은 새 연결 초기화 때 다시 처리한다. SQLite 임시 데이터를 메모리에 두고 mmap은 사용하지 않는다. 검색 색인은 같은 암호화 DB 안에 있다.

향후 다른 프로세스의 DB 접근, ATTACH, 외부 DB import, VACUUM INTO, 별도 검색 파일을 추가하면 이 고정 파일 집합과 생성 시점 정책을 확장해야 한다. 현재에는 그런 경로를 제공하지 않는다.

## 빌드 연결

package.json에는 Codegen 설정만 추가한다. 의존성과 lockfile은 변경하지 않는다. Podfile의 `configure_private_storage`는 pod install 중 앱의 기존 Xcode 프로젝트에 소스와 entitlement 경로를 멱등적으로 등록한다. 기존의 다른 entitlement 설정이 있으면 덮어쓰지 않고 설치를 중단한다. Xcode에서 직접 실행하기 전에는 pod install을 수행해야 한다.

Android는 iOS 모듈을 요구하지 않으며 기존 동작을 유지한다. 이 변경을 Android 파일 보호 완료로 해석하지 않는다. 기존 AppDelegate의 화면 가림도 유지한다. OS 파일 잠금과 선택적 Face ID 앱 잠금은 별개이다.

## 검증과 한계

추가 JS 로직 테스트는 구독 순서, 파일 보호 실패, 잠금 중 쓰기, 늦은 이벤트, 놓친 잠금-해제, 오래된 핸들, 커밋 전 차단, 종료 실패 보존과 트랜잭션 실행기 재사용 거부를 다룬다. 네이티브 상태 대역을 사용하므로 실제 iPhone 잠금 검증은 아니다.

최종 TypeScript, 전체 Jest, 린트, 보안 검사와 iOS 컴파일 결과는 해당 PR head의 CI로 기록한다. 로컬 네트워크에서 npm 레지스트리에 접근하지 못했기 때문에 로컬 보조 검사와 전체 CI 검사를 혼동하지 않는다.

다음은 실기기 검증 대상으로 남는다.

1. signed app의 기본 Data Protection entitlement와 기존/새 DB, WAL, SHM의 실제 파일 속성
2. SQLCipher 실제 런타임, Keychain의 잠금 중 접근 실패와 재실행 후 데이터 유지
3. 쿼리 실행 및 잠금이 겹칠 때의 커밋/롤백, JS 정지 상태에서 잠금 해제 후 복구
4. OS 백업 제외 동작, 앱 전환기 가림, VoiceOver, 잠금 중 입력 보존

JS 알림과 상태 조회가 OS 잠금 전에 반드시 처리된다고 보장하지 않는다. 상태 검사와 SQL 실행 사이의 아주 짧은 경합도 존재한다. 실제 디스크 접근 제한은 OS의 파일 보호가 담당하며 SQLCipher 암호화와 함께 검증한다. 이미 커밋된 쓰기를 취소했다고 표시하거나 자동 재시도하지 않는다. 메모리에 올라온 데이터의 완전한 소거를 보장하는 기능도 아니다.

암호화 수동 백업과 기기 간 복원은 아직 제공하지 않는다. 개인정보와 복구를 검증하고 백업을 제공하기 전에는 가상 데이터로 개발한다.

## 참고한 공식 문서

- https://developer.apple.com/documentation/uikit/uiapplication/protecteddatawillbecomeunavailablenotification
- https://developer.apple.com/documentation/uikit/uiapplication/isprotecteddataavailable
- https://developer.apple.com/documentation/foundation/fileprotectiontype/complete
- https://developer.apple.com/documentation/foundation/urlresourcekey/isexcludedfrombackupkey
- https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.default-data-protection
- https://reactnative.dev/docs/turbo-native-modules-introduction
- https://reactnative.dev/docs/the-new-architecture/native-modules-custom-events
- https://op-engineering.github.io/op-sqlite/docs/configuration/
