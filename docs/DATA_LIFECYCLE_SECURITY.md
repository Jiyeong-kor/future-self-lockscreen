# Future Self 데이터 생명주기와 보안 규칙

- 상태: 구현 기준선
- 최근 갱신: 2026-09-04
- 상위 문서: `docs/PRD.md`
- 스키마: `docs/DOMAIN_SCHEMA.md`

## 1. 목적

Future Self의 데이터에는 개인적인 생각, 관계, 목표, 후회, 가치관 변화가 포함될 수 있다.

따라서 이 문서는 다음을 명시적으로 정의한다.

- Private Store와 Widget 공유 데이터의 경계
- 파일 보호
- 앱 화면 노출 방지
- 로그 정책
- 수정과 revision
- 종료, 병합, 삭제
- 백업과 복원
- Public Git 저장소 규칙
- 실패 시 transaction과 recovery 원칙

---

## 2. 데이터 등급

### 2.1 Private Content

다음은 기본적으로 민감한 개인 데이터로 취급한다.

- CaptureEntry 원문
- ReflectionItem 원문
- SynthesisInsight 원문
- Motive, Vision, Goal, Practice, Commitment 내부 본문
- OriginMoment
- MeaningCheckIn
- 관계 note
- 검색 인덱스에서 복원 가능한 원문

이 데이터는 앱 Private Store에만 저장한다.

### 2.2 Public-Safe Projection

사용자가 잠금화면 공개를 명시적으로 승인한 다음 데이터만 별도 등급으로 취급한다.

- approved LockscreenProjection의 widgetMessage
- approved LockscreenProjection의 wallpaperMessage
- projection revision ID
- 표시 설정
- generation

`public-safe`는 인터넷 공개를 의미하지 않는다. 잠금화면처럼 주변 사람이 볼 수 있는 표면에 노출해도 된다고 사용자가 승인했다는 의미이다.

---

## 3. iOS Private Store 보호

사용자가 직접 만든 개인 데이터 파일에는 iOS의 강한 Data Protection을 적용한다.

기본 방향은 `FileProtectionType.complete`이다.

Apple은 사용자 개인 정보나 사용자가 직접 만든 파일에는 strongest protection을 적용하고, `complete` 파일은 기기가 잠긴 동안 읽거나 쓸 수 없다고 안내한다.

참고:

- https://developer.apple.com/documentation/Foundation/FileProtectionType/complete
- https://developer.apple.com/documentation/uikit/encrypting-your-app-s-files

### 3.1 SQLite 파일

SQLite를 사용할 경우 다음 파일을 함께 보호 대상으로 관리한다.

- main database
- WAL
- SHM
- application-level temporary files
- local search index 또는 cache 중 사용자 원문을 포함하는 파일

DB library가 생성하는 sidecar 파일의 protection class가 main DB와 달라지지 않는지 실기기에서 검증한다.

### 3.2 잠금 상태 처리

protected data가 unavailable 상태가 되면 다음 원칙을 따른다.

- 쓰기 작업을 강제로 재시도하며 손상시키지 않는다.
- 열려 있는 DB handle을 안전하게 닫거나 library 권장 방식으로 suspend한다.
- protected data가 다시 available이 된 뒤 재연결한다.
- 잠금 중 Private Store를 읽어야만 동작하는 기능을 핵심 기능으로 설계하지 않는다.

Widget은 Private Store를 직접 읽지 않는다.

---

## 4. App Group 경계

App Group에는 Public-Safe Projection만 둔다.

전체 SQLite DB를 App Group으로 이동하지 않는다.

App Group projection은 잠금화면에서 사용될 목적이므로 Private Store보다 낮은 보호 수준이 필요할 수 있다. 초기 iOS 구현에서는 `completeUntilFirstUserAuthentication` 등 잠금화면 Widget 동작과 양립 가능한 보호 수준을 실기기에서 검증한다.

여기에 민감 원문이 들어가지 않는 것이 보안 경계의 전제이다.

App Group 파일에서 허용:

- approved projection text
- projection ID
- generation
- 표시 설정
- updatedAt

금지:

- Reflection 원문
- Capture 원문
- Motive/Goal/Vision 원문
- Why Trail
- MeaningCheckIn
- 전체 관계 그래프
- 백업 암호화 키

---

## 5. 잠금화면 승인 경계

잠금화면 공개 승인은 revision 단위이다.

### 5.1 승인 절차

1. 사용자가 공개용 문장을 확인한다.
2. 앱이 해당 LockscreenProjectionRevision payload를 canonical serialization한다.
3. digest를 계산한다.
4. revision을 `approved`로 변경하고 approvedAt과 digest를 저장한다.
5. 이후 payload 수정은 기존 row 수정이 아니라 새 revision 생성이다.

따라서 과거 승인 상태가 수정된 문장에 자동 승계되지 않는다.

### 5.2 내부 Commitment 수정

내부 Commitment가 수정되어도 현재 Widget 문장은 자동 변경되지 않는다.

사용자는 새 내부 의미에 맞는 공개 문장을 작성하고 다시 승인한 뒤 대표 Projection을 교체한다.

이 규칙으로 개인 원문이 실수로 잠금화면에 노출되는 것을 방지한다.

---

## 6. App Switcher와 화면 캡처 노출

앱이 inactive/background로 전환될 때 App Switcher용 시스템 스냅샷에 개인 원문이 남을 수 있다.

따라서 iOS 앱은 앱이 비활성 상태가 되는 시점에 privacy cover를 최상단에 표시하고 foreground 복귀 후 제거한다.

privacy cover에는 개인 원문, 최근 기록, Why Trail을 표시하지 않는다.

사용자가 직접 OS 스크린샷을 찍는 행위 자체를 강제로 차단하는 것은 기본 요구사항이 아니다.

---

## 7. 로그와 Crash 보고

프로덕션 로그에 다음을 기록하지 않는다.

- 사용자 원문
- 검색어
- 공개 승인 전 잠금화면 문장
- note, trigger, doubt, currentMeaning
- export 암호 또는 암호화 키

로그에 필요한 경우 허용되는 정보:

- opaque entity ID
- schema version
- 오류 코드
- boolean 상태
- row count
- migration step ID

Crash report breadcrumb에도 사용자 텍스트를 포함하지 않는다.

외부 Crash/Analytics SDK를 도입할 경우 별도 개인정보 검토를 거친다. 기본 제품은 행동 분석 SDK를 사용하지 않는다.

---

## 8. 수정 정책

### 8.1 내용 수정

사용자가 텍스트를 수정하면 새 revision을 만든다.

기존 revision은 그대로 보존한다.

### 8.2 출처 고정

Synthesis 또는 MeaningNode를 만들 때 해당 시점의 revision ID를 evidence로 저장한다.

나중에 원문 객체를 수정해도 과거 derived object의 근거 revision은 바뀌지 않는다.

### 8.3 과거 표현과 현재 표현

Why Trail은 필요한 경우 다음을 동시에 보여줄 수 있다.

- 당시 근거로 사용한 표현
- 현재 최신 표현

둘을 같은 텍스트로 위장하지 않는다.

---

## 9. 종료 정책

Retire는 삭제가 아니다.

종료 시 node와 관계 기록을 유지하고 현재 기본 탐색에서만 제외할 수 있다.

종료 metadata:

- retirementReason
- retiredAt
- retirementNote

`deferred`의 경우 향후 다시 active로 전환할 수 있다. 이때 과거 종료 이벤트를 지우지 않고 별도 재활성화 이력을 남기는 방향으로 구현한다.

---

## 10. 관계 종료

MeaningRelation의 의미나 endpoint가 달라졌다면 기존 관계를 retire하고 새 관계를 만든다.

관계 retire는 연결 이력 삭제가 아니다.

MeaningCheckIn은 retire된 과거 관계에도 연결될 수 있다.

---

## 11. 병합 정책

병합은 사용자 경험상 중복 정리이지만 내부적으로 과거 의미를 삭제하지 않는다.

### 11.1 원자적 transaction

Node merge는 하나의 DB transaction으로 처리한다.

- source와 target 검증
- canonical target resolve
- merge cycle 검사
- source 상태 변경
- mergedIntoNodeId 설정
- NodeMergeEvent 저장

### 11.2 과거 관계

과거 relation endpoint를 target으로 rewrite하지 않는다.

과거에는 실제로 source node라는 별도 개념이 존재했기 때문이다.

현재 UI 쿼리는 merged node를 canonical target으로 resolve할 수 있다.

### 11.3 새 관계

병합 이후 새 관계는 canonical target을 사용한다.

---

## 12. 완전 삭제 정책

역사 보존은 사용자의 명시적인 삭제 권리보다 우선하지 않는다.

Hard delete는 파괴적 동작이므로 사용자에게 영향 범위를 보여준 뒤 실행한다.

### 12.1 CaptureEntry / ReflectionItem / SynthesisInsight 삭제

하나의 transaction에서:

1. stable object 삭제
2. 모든 revision 삭제
3. 해당 revision을 evidence로 가리키는 CausalEvidenceLink 삭제
4. 관련 canvas placement 삭제

해당 출처에서 과거에 만들어진 Synthesis나 MeaningNode 자체는 자동 삭제하지 않는다.

파생 객체는 독립적으로 남지만 해당 삭제된 출처는 더 이상 Why Trail에 나타나지 않는다.

### 12.2 MeaningNode 삭제

하나의 transaction에서:

1. node와 모든 revision/detail 삭제
2. node endpoint를 가진 MeaningRelation 및 relation revision 삭제
3. node를 대상으로 한 MeaningCheckIn 삭제
4. node를 derived object로 가진 CausalEvidenceLink 삭제
5. node revision을 evidence로 사용한 CausalEvidenceLink 삭제
6. OriginMoment 및 relation snapshot 삭제
7. ReviewState 삭제
8. FocusWindow 삭제
9. CanvasPlacement 삭제
10. 관련 LockscreenProjection 및 revision 삭제
11. activeAnchor가 관련 Projection을 가리키면 anchor 비움
12. merge event에서 해당 node가 source/target인 경우 삭제 영향 검증 후 정리

다른 MeaningNode와 Synthesis는 사용자가 함께 삭제하라고 선택하지 않는 한 유지한다.

### 12.3 관계 삭제

기본 UI는 관계 retire를 제공한다.

사용자가 `과거 기록에서도 완전히 삭제`를 명시적으로 선택할 때만 relation과 revision, relation 대상 MeaningCheckIn, OriginRelationSnapshot을 삭제한다.

### 12.4 전체 데이터 삭제

전체 앱 데이터 삭제는 다음을 모두 제거한다.

- Private Store
- App Group projection
- generated app-private images
- local backup cache
- search index
- preference 중 개인 콘텐츠와 연결되는 값

사진 보관함에 사용자가 직접 저장한 wallpaper 이미지는 OS Photos 데이터이므로 별도로 안내한다. 앱이 사용자 사진 보관함의 다른 데이터를 임의로 삭제하지 않는다.

---

## 13. 삭제 실패와 transaction

Hard delete 중 일부 단계만 성공한 상태를 허용하지 않는다.

DB 내부 삭제는 transaction으로 처리하고 실패하면 rollback한다.

DB commit 후 App Group projection 삭제가 실패하는 경우:

- Private Store 삭제는 되돌리지 않는다.
- App Group을 즉시 재삭제 시도한다.
- 앱 시작 시 orphaned shared projection 정리 검사를 수행한다.

개인 데이터 삭제가 우선이다.

---

## 14. 백업 포맷 요구사항

최종 사용자 백업은 평문 JSON이 아니다.

암호화 container는 최소 다음 metadata를 가진다.

```text
formatVersion
schemaVersion
createdAt
cryptoSuiteVersion
kdfMetadata
cipherMetadata
ciphertext
authenticationTag 또는 동등한 무결성 정보
```

구체 암호 알고리즘과 KDF library는 구현 시 최신 보안성과 플랫폼 지원을 검토하여 확정한다.

요구사항:

- authenticated encryption
- 사용자 암호에서 직접 encryption key를 사용하지 않음
- salt 사용
- 충분한 비용의 password KDF
- 백업 파일만으로 평문 내용을 읽을 수 없음
- 잘못된 암호와 파일 손상을 구분 가능한 오류로 처리하되 내부 crypto detail을 과도하게 노출하지 않음

---

## 15. 백업 생성

백업 절차:

1. Private DB consistent snapshot 생성
2. schema integrity 검사
3. 백업 payload 생성
4. 메모리 또는 임시 파일에서 암호화
5. 암호화 성공 후에만 사용자 저장 위치로 전달
6. 평문 temporary payload 안전하게 정리

백업에는 App Group projection을 별도로 보존할 필요가 없다. restore 후 approved Projection과 activeAnchor를 기준으로 재생성할 수 있다.

---

## 16. 복원 정책

1차 restore는 merge가 아니라 전체 교체이다.

### 16.1 restore pipeline

1. 파일 format 확인
2. 암호 해제 및 authenticated integrity 검증
3. schemaVersion 확인
4. 별도 temporary DB로 import
5. 필요한 migration 실행
6. FK/graph/revision/cycle/projection 무결성 검사
7. 모든 검사가 성공한 경우에만 현재 DB와 atomic swap
8. 실패하면 현재 DB 유지
9. 성공 후 App Group projection 재생성

### 16.2 현재 데이터가 있는 경우

사용자에게 다음을 명확히 안내한다.

`복원하면 현재 기기의 Future Self 데이터가 백업 시점 데이터로 교체됩니다.`

자동 병합하지 않는다.

서로 다른 두 백업 또는 두 기기의 데이터를 의미적으로 병합하는 기능은 별도 import/merge 제품 기능이다.

---

## 17. schema migration

모든 DB는 schemaVersion을 가진다.

migration 원칙:

- migration은 순방향 명시적 단계로 관리
- destructive migration을 기본 fallback으로 사용하지 않음
- migration 전후 integrity test
- 실패 시 사용자 데이터가 있는 기존 DB를 삭제하지 않음
- 개발 중에도 실제 장기 데이터가 있다고 가정하고 migration test fixture 운영

fixture는 완전히 가상 데이터만 사용한다.

---

## 18. Widget 동기화

Widget은 Private DB와 eventual consistency 관계이다.

activeAnchor 변경 시:

1. Private DB transaction commit
2. approved ProjectionRevision 확인
3. App Group에 새 WidgetProjection을 atomic write
4. generation 증가
5. WidgetCenter reload 요청

App Group write 또는 reload request가 실패하면 retry 가능한 sync 상태를 저장한다.

사용자에게 OS가 실제 Widget을 즉시 렌더링했다고 거짓으로 표시하지 않는다.

Apple은 WidgetKit reload에 일일 budget을 적용하고 timeline entry 날짜에 정확히 갱신된다고 보장하지 않는다.

참고:

- https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date
- https://developer.apple.com/documentation/widgetkit/timeline

---

## 19. Public Git 저장소

현재 저장소는 Public이다.

금지:

- 실제 사용자 DB
- 실제 export
- 실제 개인 회고 원문
- 개인 정보가 포함된 test fixture
- 실사용 화면 캡처 중 개인 원문이 보이는 이미지
- production 로그
- 암호화 키 또는 비밀번호

문서 예시는 가능한 한 가상 사례를 사용한다.

이미 Git history에 들어간 과거 텍스트는 현재 브랜치에서 삭제해도 즉시 Git history에서 제거되는 것은 아니다. 민감 정보가 실제로 커밋된 경우에는 단순 파일 수정이 아니라 별도의 history purge 절차를 수행해야 한다.

---

## 20. 보안 테스트

필수 테스트:

- iOS 잠금 중 Private Store 접근 불가 확인
- DB/WAL/SHM protection class 확인
- App Group에 private text가 없는지 검사
- Projection revision 수정 후 승인 자동 승계 금지
- App Switcher privacy cover
- production log text redaction
- hard delete 후 SQLite와 App Group에서 잔존 데이터 검사
- backup 파일에서 평문 문자열 검색 실패 확인
- 잘못된 암호 restore 실패
- 손상된 backup restore 실패
- restore failure 후 기존 DB 보존
