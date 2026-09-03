# Future Self 데이터 생명주기와 보안 규칙

- 상태: 구현 기준선
- 최근 갱신: 2026-09-04
- 상위 문서: `docs/PRD.md`
- 스키마: `docs/DOMAIN_SCHEMA.md`

## 1. 목적

Future Self의 데이터에는 개인적인 생각, 관계, 목표, 후회, 가치관 변화가 포함될 수 있다.

이 문서는 다음을 정의한다.

- Private Store와 Widget 공유 데이터의 경계
- 파일 보호
- 앱 화면 노출 방지
- 로그 정책
- revision과 lifecycle event
- 종료, 병합, 삭제
- 백업과 복원
- Public Git 저장소 규칙
- 실패 시 transaction과 recovery 원칙

## 2. 데이터 등급

### 2.1 Private Content

다음은 기본적으로 민감한 개인 데이터이다.

- CaptureEntry 원문
- ReflectionItem 원문
- SynthesisInsight 원문
- Motive, Vision, Goal, Practice, Commitment 내부 본문
- OriginMoment
- MeaningCheckIn
- relation note
- 검색 인덱스에서 복원 가능한 원문

이 데이터는 앱 Private Store에만 저장한다.

### 2.2 Public-Safe Projection

사용자가 잠금화면 공개를 명시적으로 승인한 데이터만 별도 등급으로 취급한다.

- approved ProjectionRevision의 widgetMessage
- approved ProjectionRevision의 wallpaperMessage
- projection revision ID
- 표시 설정
- generation

`public-safe`는 인터넷 공개가 아니라 잠금화면처럼 주변 사람이 볼 수 있는 표면에 노출해도 된다고 사용자가 승인했다는 뜻이다.

## 3. iOS Private Store 보호

사용자가 직접 만든 개인 데이터 파일에는 iOS의 강한 Data Protection을 적용한다.

기본 방향은 `FileProtectionType.complete`이다.

Apple은 사용자 개인 정보나 사용자가 직접 만든 파일에는 강한 보호 수준을 적용하도록 안내하고, `complete` 파일은 기기가 잠긴 동안 읽거나 쓸 수 없다고 설명한다.

참고:

- https://developer.apple.com/documentation/Foundation/FileProtectionType/complete
- https://developer.apple.com/documentation/uikit/encrypting-your-app-s-files

### 3.1 SQLite 파일

다음 파일을 함께 보호한다.

- main database
- WAL
- SHM
- application-level temporary files
- 사용자 원문을 포함하는 local search index/cache

DB library가 생성하는 sidecar 파일의 protection class가 main DB와 달라지지 않는지 실기기에서 검증한다.

### 3.2 잠금 상태 처리

protected data unavailable 시:

- 쓰기를 억지로 수행하지 않는다.
- DB handle을 library 권장 방식으로 닫거나 suspend한다.
- protected data available 이후 안전하게 재연결한다.
- 잠금 중 Private Store를 읽어야만 동작하는 기능을 핵심 기능으로 두지 않는다.

Widget은 Private Store를 직접 읽지 않는다.

## 4. App Group 경계

App Group에는 Public-Safe Projection만 둔다.

전체 SQLite DB를 App Group으로 이동하지 않는다.

App Group projection은 잠금화면에서 사용될 목적이므로 Private Store보다 낮은 보호 수준이 필요할 수 있다. 초기 iOS 구현에서는 `completeUntilFirstUserAuthentication` 등 잠금화면 Widget 동작과 양립 가능한 보호 수준을 실기기에서 검증한다.

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
- 백업 암호화 키

## 5. 잠금화면 승인 lifecycle

ProjectionRevision 내용과 승인 상태를 같은 row에서 변경하지 않는다.

ProjectionRevision은 immutable content이고 승인은 `ProjectionApprovalEvent`라는 immutable event이다.

### 5.1 승인

1. 사용자가 공개용 문장을 확인한다.
2. 앱이 ProjectionRevision payload를 canonical serialization한다.
3. digest를 계산한다.
4. `approved` ProjectionApprovalEvent를 생성한다.
5. 동일 transaction에서 승인 대상 revision과 digest 정합성을 검증한다.

### 5.2 철회

사용자가 승인을 철회하면 `revoked` ProjectionApprovalEvent를 생성한다.

해당 revision이 activeAnchor라면 같은 Private DB transaction에서 activeAnchor를 비운다.

DB commit 후 App Group에서 기존 projection을 제거하거나 빈 상태로 갱신하고 Widget reload를 요청한다.

### 5.3 현재 승인 상태

해당 ProjectionRevision의 가장 최근 ApprovalEvent로 계산한다.

- event 없음 → 미승인
- latest approved → 승인
- latest revoked → 철회

### 5.4 문장 수정

공개 문장 수정은 기존 ProjectionRevision 수정이 아니라 새 ProjectionRevision 생성이다.

새 revision에는 approval event가 없으므로 자동으로 재승인이 필요하다.

내부 Commitment revision이 바뀌어도 과거 approved ProjectionRevision은 자동 수정되지 않는다.

## 6. App Switcher와 화면 노출

앱이 inactive/background로 전환될 때 App Switcher용 시스템 스냅샷에 개인 원문이 남지 않도록 privacy cover를 최상단에 표시한다.

foreground 복귀 후 cover를 제거한다.

privacy cover에는 개인 원문, 최근 기록, Why Trail을 표시하지 않는다.

사용자가 직접 OS 스크린샷을 촬영하는 동작을 기본적으로 차단하지 않는다.

## 7. 로그와 Crash 보고

프로덕션 로그에 다음을 기록하지 않는다.

- 사용자 원문
- 검색어
- 공개 승인 전 잠금화면 문장
- relation note
- MeaningCheckIn의 trigger/doubt/currentMeaning
- export 암호 또는 암호화 키

허용 가능한 운영 정보:

- opaque entity ID
- schema version
- 오류 코드
- boolean 상태
- row count
- migration step ID

외부 Crash/Analytics SDK를 도입하려면 별도 개인정보 검토를 거친다. 기본 제품은 행동 분석 SDK를 사용하지 않는다.

## 8. 수정 정책

사용자 텍스트 수정은 새 revision 생성이다.

기존 revision을 수정하지 않는다.

Synthesis 또는 MeaningNode revision을 만들 때 근거로 사용한 revision/event ID를 causal evidence에 저장한다.

Why Trail에서는 필요하면 당시 근거 표현과 현재 최신 표현을 구분하여 보여준다.

## 9. MeaningNode lifecycle

pause/resume/retire/reactivate/archive는 단일 timestamp 필드로 과거를 덮어쓰지 않는다.

모든 상태 변화는 `MeaningNodeLifecycleEvent`로 남긴다.

MeaningNode.status는 현재 조회를 위한 cache이며 lifecycle event와 같은 transaction에서 갱신한다.

예시:

```text
active
→ paused
→ resumed
→ retired(reason=deferred)
→ reactivated
→ retired(reason=achieved)
```

이 전체 이력을 보존할 수 있어야 한다.

병합은 일반 lifecycle이 아니라 `NodeMergeEvent`로 별도 처리하고 merged node를 다시 활성화하지 않는다.

## 10. 관계 종료

MeaningRelation endpoint 또는 kind가 달라지면 기존 관계를 retire하고 새 관계를 만든다.

retire된 동일 관계를 재활성화하지 않는다. 다시 연결하고 싶다면 새 relation ID를 만든다.

이 방식으로 연결이 끊겼다가 다시 생긴 시간 구간을 보존한다.

## 11. 병합 정책

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

## 12. 완전 삭제 정책

사용자의 명시적인 hard delete 요청은 역사 보존보다 우선한다.

### 12.1 CaptureEntry / ReflectionItem / SynthesisInsight

하나의 transaction에서:

1. stable object 삭제
2. 모든 revision 삭제
3. 해당 revision을 evidence로 가리키는 CausalEvidenceLink 삭제
4. 관련 canvas placement 삭제

해당 출처에서 과거에 만들어진 다른 Synthesis나 MeaningNode는 자동 삭제하지 않는다.

### 12.2 MeaningNode

하나의 transaction에서:

1. node와 모든 revision/detail 삭제
2. MeaningNodeLifecycleEvent 삭제
3. node endpoint를 가진 MeaningRelation과 relation revision 삭제
4. 해당 relation을 대상으로 한 MeaningCheckIn 삭제
5. node를 대상으로 한 MeaningCheckIn 삭제
6. node revision을 evidence 또는 derived revision으로 사용하는 CausalEvidenceLink 삭제
7. OriginMoment/OriginRelationSnapshot 삭제
8. ReviewState 삭제
9. FocusWindow 삭제
10. CanvasPlacement 삭제
11. 관련 LockscreenProjection과 ProjectionRevision 삭제
12. 관련 ProjectionApprovalEvent 삭제
13. activeAnchor가 관련 ProjectionRevision을 가리키면 anchor 비움
14. 관련 NodeMergeEvent 영향 검증 후 정리

다른 독립 객체는 사용자가 함께 삭제하라고 선택하지 않는 한 유지한다.

### 12.3 MeaningRelation

기본 UI는 retire를 제공한다.

사용자가 과거 기록에서도 완전 삭제를 선택한 경우에만 relation, relation revision, relation 대상 MeaningCheckIn, 관련 OriginRelationSnapshot, relation revision을 evidence로 사용하는 CausalEvidenceLink를 삭제한다.

### 12.4 전체 데이터 삭제

다음을 모두 제거한다.

- Private Store
- App Group projection
- generated app-private images
- local backup cache
- search index
- 개인 콘텐츠와 연결되는 preference

사진 보관함에 사용자가 직접 저장한 wallpaper는 Photos 데이터이므로 별도로 안내한다.

## 13. 삭제 실패와 transaction

DB 내부 hard delete는 하나의 transaction으로 처리하고 실패하면 rollback한다.

DB commit 이후 App Group 정리가 실패하면 Private DB 삭제를 되돌리지 않는다.

- App Group 삭제 재시도
- 다음 앱 시작 시 orphaned shared projection cleanup
- 개인 Private Data 삭제 우선

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

구체 cipher/KDF와 library는 구현 시 최신 보안성과 플랫폼 지원을 검토하여 확정한다.

필수 성질:

- authenticated encryption
- password를 직접 encryption key로 사용하지 않음
- salt 사용
- 비용이 충분한 password KDF
- 파일만으로 평문을 읽을 수 없음
- 암호화 키와 password를 로그에 기록하지 않음

## 15. 백업 생성

1. Private DB consistent snapshot 생성
2. schema integrity 검사
3. payload 생성
4. 암호화
5. 암호화 성공 후에만 사용자 저장 위치로 전달
6. 평문 temporary payload 정리

App Group projection은 backup 핵심 데이터가 아니다. restore 후 approved Projection과 activeAnchor에서 재생성한다.

## 16. 복원 정책

1차 restore는 기존 데이터와 자동 병합하지 않고 전체 교체한다.

### restore pipeline

1. format 확인
2. 암호 해제와 authenticated integrity 검증
3. schemaVersion 확인
4. temporary DB로 import
5. migration 실행
6. FK/revision/causal cycle/projection approval/anchor 무결성 검사
7. 모든 검사가 성공한 경우에만 현재 DB와 atomic swap
8. 실패 시 현재 DB 유지
9. 성공 후 App Group projection 재생성

현재 데이터가 있는 경우 `복원하면 현재 기기의 Future Self 데이터가 백업 시점 데이터로 교체됩니다.`라는 의미를 명확히 안내한다.

서로 다른 데이터 세트의 의미적 merge import는 별도 기능이다.

## 17. schema migration

- 순방향 명시적 migration
- destructive migration을 기본 fallback으로 사용하지 않음
- migration 전후 integrity test
- 실패 시 기존 사용자 DB 삭제 금지
- 장기 데이터가 있다고 가정한 가상 fixture 운영

## 18. Widget 동기화

Widget은 Private DB와 eventual consistency 관계이다.

activeAnchor 변경 시:

1. Private DB transaction commit
2. 최신 approval event 기준 approved ProjectionRevision 확인
3. App Group WidgetProjection atomic write
4. generation 증가
5. WidgetCenter reload 요청

App Group write 실패 시 재동기화 상태를 남긴다.

사용자에게 OS가 실제 Widget을 즉시 렌더링했다고 표시하지 않는다.

Apple은 WidgetKit reload에 일일 budget을 적용하며 timeline entry 날짜에 정확히 업데이트된다고 보장하지 않는다.

참고:

- https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date
- https://developer.apple.com/documentation/widgetkit/timeline

## 19. Public Git 저장소

금지:

- 실제 사용자 DB
- 실제 export
- 실제 개인 회고 원문
- 개인 정보가 포함된 fixture
- 개인 텍스트가 보이는 실사용 스크린샷
- production 로그
- 암호화 키/비밀번호

문서와 테스트 예시는 가상 사례를 사용한다.

현재 브랜치에서 과거 초안 본문을 제거해도 이미 Git history에 들어간 내용이 자동으로 삭제되는 것은 아니다. 실제 민감 정보가 커밋된 경우에는 별도 history purge가 필요하다.

## 20. 보안 테스트

- 잠금 중 Private Store 접근 불가 확인
- DB/WAL/SHM protection class 확인
- App Group private text 부재 검사
- 새 ProjectionRevision에 과거 승인 자동 승계 금지
- Projection revoke 시 activeAnchor 해제
- App Switcher privacy cover
- production log 원문 redaction
- hard delete 후 SQLite/App Group 잔존 데이터 검사
- backup 파일에서 평문 문자열 검색 실패
- 잘못된 암호 restore 실패
- 손상 backup restore 실패
- restore 실패 후 기존 DB 보존
