# Future Self 데이터 생명주기와 보안 규칙 v1.1

- 상태: 구현 기준선
- 최근 갱신: 2026-09-04
- 상위 문서: `docs/PRD.md`
- 스키마: `docs/DOMAIN_SCHEMA.md`

## 1. 목적

Future Self의 데이터에는 개인적인 생각, 관계, 목표, 후회, 욕망, 가치관 변화가 포함될 수 있다.

이 문서는 다음을 정의한다.

- Private Store와 Widget 공유 데이터의 경계
- 파일 보호
- 선택적 앱 잠금
- 앱 화면 노출 방지
- 검색 인덱스 보호
- 로그 정책
- revision과 lifecycle event
- 종료, 병합, 삭제
- 백업과 복원
- 사람이 읽을 수 있는 export
- App Intents와 외부 시스템 경계
- Public Git 저장소 규칙
- 실패 시 transaction과 recovery 원칙

---

## 2. 데이터 등급

### 2.1 Private Content

다음은 기본적으로 민감한 개인 데이터이다.

- CaptureEntry 원문과 revision
- ReflectionItem 원문과 revision
- SynthesisInsight 원문과 revision
- Motive, Vision, Goal, Practice, Commitment 내부 본문
- OriginMoment
- MeaningCheckIn
- relation note
- Why Trail에서 복원되는 원문
- 검색어와 검색 인덱스에서 원문을 복원할 수 있는 데이터
- export 생성 중의 평문 임시 파일

이 데이터는 앱 Private Store에만 저장한다.

### 2.2 Public-Safe Projection

사용자가 잠금화면 공개를 명시적으로 승인한 데이터만 별도 등급으로 취급한다.

- approved ProjectionRevision의 widgetMessage
- approved ProjectionRevision의 wallpaperMessage
- projection revision ID
- 표시 설정
- generation

`public-safe`는 인터넷 공개가 아니라 잠금화면처럼 주변 사람이 볼 수 있는 표면에 노출해도 된다고 사용자가 승인했다는 뜻이다.

---

## 3. iOS Private Store 보호

사용자가 직접 만든 개인 데이터 파일에는 iOS의 강한 Data Protection을 적용한다.

기본 방향은 `FileProtectionType.complete`이다.

보호 대상:

- main SQLite database
- WAL
- SHM
- application-level temporary files
- 검색 인덱스
- 사용자 원문을 포함하는 cache
- export 생성 중의 app-private temporary file

DB library가 생성하는 sidecar 파일의 protection class가 main DB와 달라지지 않는지 실기기에서 검증한다.

### 3.1 잠금 상태 처리

protected data unavailable 시:

- 쓰기를 억지로 수행하지 않는다.
- DB handle을 library 권장 방식으로 닫거나 suspend한다.
- protected data available 이후 안전하게 재연결한다.
- 잠금 중 Private Store를 읽어야만 동작하는 기능을 핵심 기능으로 두지 않는다.

Widget은 Private Store를 직접 읽지 않는다.

---

## 4. 선택적 앱 잠금

사용자는 앱 자체 잠금을 선택적으로 활성화할 수 있다.

### 4.1 인증 방식

1차 iOS 구현은 `LocalAuthentication`을 사용한다.

허용 인증은 시스템 정책을 따른다.

- Face ID
- Touch ID
- 시스템이 제공하는 기기 인증 fallback

앱은 생체 정보 원본을 읽거나 저장하지 않는다.

### 4.2 잠금 모드

사용자 설정 후보:

- 사용 안 함
- 앱을 다시 열 때마다 인증
- 백그라운드 전환 후 지정된 grace period가 지나면 인증

정확한 grace period 선택지는 구현 UX 단계에서 정한다.

### 4.3 인증 전 화면 보호

앱 잠금이 활성화된 경우 인증이 끝나기 전에 다음을 화면에 표시하지 않는다.

- 최근 기록
- 검색 결과
- Why Trail
- Review 카드 원문
- 회고 내용
- 의미 노드 본문

앱은 인증 화면보다 먼저 민감 화면을 렌더링한 뒤 가리는 방식을 사용하지 않는다.

### 4.4 인증 실패와 취소

인증 실패 또는 사용자가 인증을 취소하면 개인 화면으로 진입하지 않는다.

반복 실패를 앱 자체 점수나 실패 이력으로 저장하지 않는다.

### 4.5 Widget과의 관계

앱 잠금은 이미 사용자가 승인한 Public-Safe Projection의 Widget 표시를 자동 중단하지 않는다.

앱 잠금과 잠금화면 공개 승인은 서로 다른 사용자 결정이다.

---

## 5. App Group 경계

App Group에는 Public-Safe Projection만 둔다.

전체 SQLite DB를 App Group으로 이동하지 않는다.

허용:

- approved projection text
- projection revision ID
- generation
- 표시 설정
- updatedAt

금지:

- Reflection/Capture/Synthesis 원문
- Motive/Goal/Vision 원문
- Why Trail
- MeaningCheckIn
- 전체 관계 그래프
- 검색 인덱스
- 백업 암호화 키

App Group projection은 잠금화면 Widget과 양립 가능한 파일 보호 수준을 실기기에서 검증한다.

---

## 6. 잠금화면 승인 lifecycle

ProjectionRevision 내용과 승인 상태를 같은 row에서 변경하지 않는다.

ProjectionRevision은 immutable content이고 승인은 `ProjectionApprovalEvent`라는 immutable event이다.

### 6.1 승인

1. 사용자가 공개용 문장을 확인한다.
2. 앱이 ProjectionRevision payload를 canonical serialization한다.
3. digest를 계산한다.
4. `approved` ProjectionApprovalEvent를 생성한다.
5. 같은 transaction에서 revision과 digest 정합성을 검증한다.

### 6.2 철회

사용자가 승인을 철회하면 `revoked` ProjectionApprovalEvent를 생성한다.

해당 revision이 activeAnchor라면 같은 Private DB transaction에서 activeAnchor를 비운다.

DB commit 후 App Group에서 기존 projection을 제거하거나 빈 상태로 갱신하고 Widget reload를 요청한다.

### 6.3 문장 수정

공개 문장 수정은 기존 ProjectionRevision 수정이 아니라 새 ProjectionRevision 생성이다.

새 revision에는 approval event가 없으므로 자동으로 재승인이 필요하다.

내부 Commitment revision이 바뀌어도 과거 approved ProjectionRevision은 자동 수정되지 않는다.

---

## 7. App Switcher와 화면 노출

앱이 inactive/background로 전환될 때 App Switcher용 시스템 스냅샷에 개인 원문이 남지 않도록 privacy cover를 최상단에 표시한다.

foreground 복귀 후 앱 잠금 정책을 평가하고, 필요한 경우 인증 성공 후에만 cover를 제거한다.

privacy cover에는 개인 원문, 최근 기록, Why Trail을 표시하지 않는다.

사용자가 직접 OS 스크린샷을 촬영하는 동작을 기본적으로 차단하지 않는다.

---

## 8. 검색 인덱스 보안

검색은 장기 사용의 핵심 기능이지만 검색 인덱스도 Private Content이다.

원칙:

- 검색 인덱스를 App Group에 두지 않는다.
- 개인 원문을 시스템 Spotlight index에 자동 등록하지 않는다.
- 검색 인덱스 파일도 Private Store와 같은 보호 정책을 따른다.
- 검색 인덱스는 재생성 가능한 파생 데이터이다.
- hard delete 후 해당 텍스트가 검색 인덱스에 남지 않도록 동기화한다.
- 전체 데이터 삭제 시 검색 인덱스를 함께 제거한다.

과거 revision 검색을 사용자가 켠 경우에도 결과는 앱 내부에서만 제공한다.

---

## 9. 로그와 Crash 보고

프로덕션 로그에 다음을 기록하지 않는다.

- 사용자 원문
- 검색어
- 공개 승인 전 잠금화면 문장
- relation note
- MeaningCheckIn 원문
- export 평문
- export 암호
- 암호화 키
- App Intent로 입력된 민감 원문

허용 가능한 운영 정보:

- opaque entity ID
- schema version
- 오류 코드
- boolean 상태
- row count
- migration step ID

외부 Crash/Analytics SDK를 도입하려면 별도 개인정보 검토를 거친다. 기본 제품은 행동 분석 SDK를 사용하지 않는다.

---

## 10. 수정과 revision

사용자 텍스트 수정은 새 revision 생성이다.

기존 revision을 수정하지 않는다.

Synthesis 또는 MeaningNode revision을 만들 때 근거로 사용한 revision/event ID를 causal evidence에 저장한다.

Why Trail과 시간 여행 UI에서는 당시 근거 표현과 현재 최신 표현을 구분하여 보여준다.

---

## 11. MeaningNode lifecycle

pause, resume, retire, reactivate, archive는 단일 timestamp 필드로 과거를 덮어쓰지 않는다.

모든 상태 변화는 immutable lifecycle event로 남긴다.

현재 status는 조회 cache이며 event와 같은 transaction에서 갱신한다.

병합은 일반 lifecycle이 아니라 NodeMergeEvent로 처리하고 merged node를 다시 활성화하지 않는다.

---

## 12. 관계 종료와 재연결

MeaningRelation endpoint 또는 kind가 달라지면 기존 관계를 retire하고 새 관계를 만든다.

retire된 동일 relation row를 재활성화하지 않는다. 다시 연결하고 싶다면 새 relation ID를 만든다.

이 방식으로 연결이 끊겼다가 다시 생긴 시간 구간을 보존한다.

---

## 13. 병합 정책

병합은 중복 개념 정리이다. `supersedes`와 혼동하지 않는다.

Node merge는 하나의 DB transaction으로 처리한다.

- source/target 검증
- canonical target resolve
- merge cycle 검사
- source status를 merged로 변경
- mergedIntoNodeId 설정
- NodeMergeEvent 저장

과거 relation endpoint를 target으로 rewrite하지 않는다.

현재 UI 쿼리는 merged source를 canonical target으로 resolve한다.

---

## 14. 완전 삭제 정책

사용자의 명시적인 hard delete 요청은 역사 보존보다 우선한다.

### 14.1 CaptureEntry / ReflectionItem / SynthesisInsight

하나의 transaction에서:

1. stable object 삭제
2. 모든 revision 삭제
3. 해당 revision을 evidence로 가리키는 causal link 삭제
4. 관련 canvas placement 삭제
5. 검색 인덱스 제거 예약 또는 동기 삭제

해당 출처에서 과거에 만들어진 다른 Synthesis나 MeaningNode는 자동 삭제하지 않는다.

### 14.2 MeaningNode

하나의 transaction에서:

1. node와 모든 revision/detail 삭제
2. lifecycle event 삭제
3. node endpoint를 가진 MeaningRelation 삭제
4. 관련 MeaningCheckIn 삭제
5. causal evidence 삭제
6. OriginMoment/OriginRelationSnapshot 삭제
7. ReviewState와 FocusWindow 삭제
8. CanvasPlacement 삭제
9. 관련 LockscreenProjection/Revision/ApprovalEvent 삭제
10. activeAnchor가 관련 projection을 가리키면 anchor 비움
11. NodeMergeEvent 영향 검증 후 정리
12. 검색 인덱스 제거

다른 독립 객체는 사용자가 함께 삭제하라고 선택하지 않는 한 유지한다.

### 14.3 전체 데이터 삭제

다음을 모두 제거한다.

- Private Store
- App Group projection
- app-private generated images
- backup cache
- search index
- 개인 콘텐츠와 연결되는 preference

사진 보관함에 사용자가 직접 저장한 wallpaper는 Photos 데이터이므로 별도로 안내한다.

---

## 15. 삭제 실패와 transaction

DB 내부 hard delete는 하나의 transaction으로 처리하고 실패하면 rollback한다.

DB commit 이후 App Group 정리가 실패하면 Private DB 삭제를 되돌리지 않는다.

- App Group 삭제 재시도
- 다음 앱 시작 시 orphaned shared projection cleanup
- Private Data 삭제 우선

---

## 16. 암호화 백업

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

구체 cipher/KDF와 library는 구현 시 최신 보안성과 플랫폼 지원을 검토하여 확정한다.

필수 성질:

- authenticated encryption
- password를 직접 encryption key로 사용하지 않음
- salt 사용
- 충분한 비용의 password KDF
- 파일만으로 평문을 읽을 수 없음
- 암호화 키와 password를 로그에 기록하지 않음

### 16.1 백업 생성

1. Private DB consistent snapshot 생성
2. schema integrity 검사
3. payload 생성
4. 암호화
5. 암호화 성공 후에만 사용자 저장 위치로 전달
6. 평문 temporary payload 정리

App Group projection은 backup 핵심 데이터가 아니다. restore 후 approved Projection과 activeAnchor에서 재생성한다.

---

## 17. 복원 정책

1차 restore는 기존 데이터와 자동 병합하지 않고 전체 교체한다.

1. format 확인
2. 암호 해제와 authenticated integrity 검증
3. schemaVersion 확인
4. temporary DB로 import
5. migration 실행
6. FK, revision, causal cycle, projection approval, anchor 무결성 검사
7. 모든 검사가 성공한 경우에만 현재 DB와 atomic swap
8. 실패 시 현재 DB 유지
9. 성공 후 App Group projection과 검색 인덱스 재생성

현재 데이터가 있는 경우 교체된다는 점을 명확히 안내한다.

서로 다른 데이터 세트의 의미적 merge import는 별도 기능이다.

---

## 18. 사람이 읽을 수 있는 export

암호화 백업과 human-readable export를 구분한다.

### 18.1 export 범위

사용자가 명시적으로 선택한 범위만 export한다.

- 특정 회고
- 특정 Why Trail
- 특정 Goal/Commitment와 관련된 기록
- 선택한 기간

초기 기본 포맷 후보는 Markdown이다. PDF는 후속 표현 포맷으로 추가할 수 있다.

### 18.2 export 보안

human-readable export는 평문이 될 수 있으므로 다음을 따른다.

- 앱 잠금이 활성화된 경우 export 직전에 재인증을 요구한다.
- export 범위와 포함될 내용의 종류를 미리 보여준다.
- 사용자가 명시적으로 공유 또는 저장 대상을 선택한다.
- app-private 임시 평문 파일은 완료 또는 취소 후 정리한다.
- export 파일 자체는 앱을 떠난 뒤 Future Self의 Private Store 보호를 받지 않는다고 안내한다.

### 18.3 export와 삭제

export를 만들었다고 앱 데이터의 lifecycle이 바뀌지 않는다.

앱에서 데이터를 삭제해도 사용자가 외부에 저장한 export 사본까지 자동 삭제할 수 없음을 안내한다.

---

## 19. schema migration

- 순방향 명시적 migration
- destructive migration을 기본 fallback으로 사용하지 않음
- migration 전후 integrity test
- 실패 시 기존 사용자 DB 삭제 금지
- 장기 데이터가 있다고 가정한 대규모 합성 fixture 운영

---

## 20. Widget 동기화

Widget은 Private DB와 eventual consistency 관계이다.

activeAnchor 변경 시:

1. Private DB transaction commit
2. 최신 approval event 기준 approved ProjectionRevision 확인
3. App Group WidgetProjection atomic write
4. generation 증가
5. WidgetCenter reload 요청

App Group write 실패 시 재동기화 상태를 남긴다.

사용자에게 OS가 실제 Widget을 즉시 렌더링했다고 표시하지 않는다.

---

## 21. App Intents와 시스템 통합

App Intents / App Shortcuts는 개인 콘텐츠를 시스템 검색에 공개하기 위한 기능이 아니라 빠른 액션 진입점으로 사용한다.

기본 허용 방향:

- `빠른 기록 열기`
- `Future Self에 기록하기` 같은 사용자 명시 액션

기본 금지 방향:

- 전체 CaptureEntry를 Spotlight entity로 자동 색인
- Why Graph 노드를 Spotlight 검색 가능한 개인 콘텐츠로 자동 공개
- 승인하지 않은 개인 원문을 Siri/Shortcuts 결과에 반환

원문을 App Intent parameter로 직접 받는 기능은 해당 문자열이 Siri, Shortcuts history, 자동화 로그 등 시스템 표면에 어떻게 남을 수 있는지 구현 시 검토한 뒤 허용한다.

불확실한 경우에는 App Intent가 앱의 잠긴 빠른 기록 화면을 여는 방식으로 제한한다.

---

## 22. 외부 실행 도구 연동

Apple Reminders, Calendar, Shortcuts 등에 데이터를 보낼 때에는 사용자 명시 동작을 요구한다.

전송 전에 어떤 텍스트와 날짜가 외부 앱으로 넘어가는지 보여준다.

Future Self의 내부 Motive, Reflection, MeaningCheckIn 원문을 실행 일정 생성에 자동 포함하지 않는다.

외부 도구에 생성된 데이터의 보안과 보존은 해당 도구의 정책을 따른다는 점을 구분한다.

---

## 23. Public Git 저장소

금지:

- 실제 사용자 DB
- 실제 export
- 실제 개인 회고 원문
- 개인 정보가 포함된 fixture
- 개인 텍스트가 보이는 실사용 스크린샷
- production 로그
- 암호화 키/비밀번호

문서와 테스트 예시는 가상 사례를 사용한다.

실제 민감 정보가 Git history에 들어간 경우에는 현재 브랜치에서 파일을 지우는 것만으로 충분하지 않으며 별도 history purge가 필요하다.

---

## 24. 보안 테스트

- 잠금 중 Private Store 접근 불가 확인
- DB/WAL/SHM/search index protection class 확인
- App Group private text 부재 검사
- 새 ProjectionRevision에 과거 승인 자동 승계 금지
- Projection revoke 시 activeAnchor 해제
- App Switcher privacy cover
- 앱 잠금 인증 전 개인 화면 미노출
- 인증 실패와 취소 안전 처리
- production log 원문 redaction
- hard delete 후 SQLite/App Group/search index 잔존 데이터 검사
- backup 파일에서 평문 문자열 검색 실패
- 잘못된 암호 restore 실패
- 손상 backup restore 실패
- restore 실패 후 기존 DB 보존
- human-readable export 재인증
- export 완료/취소 후 임시 평문 파일 정리
- App Intents가 승인하지 않은 개인 원문을 시스템 결과에 노출하지 않는지 검증
