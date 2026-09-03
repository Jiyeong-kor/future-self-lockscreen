# Future Self Lockscreen v0.4 제품 규칙

- 상태: 확정
- 확정일: 2026-09-04
- 적용 범위: `docs/PRD.md`, `docs/WHY_GRAPH.md`, `docs/REFLECTION_MODEL.md`, `docs/SYNTHESIS_MODEL.md`, `docs/BLOCK_CANVAS.md`, `docs/RED_TEAM_REVIEW.md`
- 우선순위: 기존 문서와 충돌하는 경우 이 문서의 규칙을 우선한다.

## 1. 기본 진입점

앱의 기본 진입점은 연말 회고가 아니라 **빠른 기록 중심 홈**으로 확정한다.

홈의 최우선 구성은 다음과 같다.

1. 지금 잠금화면에 표시 중인 대표 문장
2. 한 줄 빠른 기록 입력
3. 최근 기록
4. 다시 볼 필요가 있는 원칙 `Review Queue`
5. 회고 진입점

연말 회고는 중요한 기능이지만 앱을 연중 사용할 수 있도록 별도 주요 기능으로 제공한다.

사용자는 어떤 생각을 기록하는 순간부터 목표나 행동 원칙을 정할 필요가 없다. 기록은 먼저 축적될 수 있고, 여러 기록을 나중에 묶어 `SynthesisInsight`를 만들 수 있다.

## 2. 잠금화면 공개 경계

잠금화면은 기기 소유자 외의 사람이 볼 수 있으므로 내부 Why Graph 원문을 자동으로 노출하지 않는다.

### 2.1 공개 승인 문장

잠금화면에 표시하는 문장은 내부 Commitment 본문과 분리한다.

```ts
export type LockscreenProjection = {
  commitmentNodeId: string;
  publicSafeMessage: string;
  approvedForLockscreen: boolean;
  approvedAt?: string;
  updatedAt: string;
};
```

규칙:

- `approvedForLockscreen === true`인 문장만 Widget 및 잠금화면 이미지에 사용한다.
- 사용자는 잠금화면에 실제로 보일 문장을 직접 확인한 뒤 승인한다.
- 내부 회고, Motive, Vision, Goal, MeaningCheckIn 원문을 잠금화면 문장으로 자동 대체하지 않는다.
- 승인 문장을 수정하면 다시 승인하도록 할 수 있다.

### 2.2 App Group 최소화

iOS Widget Extension이 읽는 App Group에는 전체 데이터베이스를 넣지 않는다.

App Group에는 다음 최소 데이터만 투영한다.

- 현재 대표 Commitment의 식별자
- `publicSafeMessage`
- 필요한 최소 표시 설정
- 데이터 갱신 시각

ReflectionItem, CaptureEntry, SynthesisInsight, Motive, Vision, Goal, MeaningCheckIn 등의 민감 원문은 Private Store에만 둔다.

## 3. 상시 보존과 실제 노출을 분리한다

기존 `persistent` 개념은 하나의 의미로 사용하지 않는다.

다음 세 상태를 분리한다.

1. `retained`: 장기적으로 보존할 원칙인가
2. `eligibleForLockscreen`: 잠금화면 후보가 될 수 있는가
3. `activeAnchor`: 현재 잠금화면의 대표 원칙인가

하나의 원칙은 오랫동안 retained 상태일 수 있지만 항상 activeAnchor일 필요는 없다.

잠금화면에는 MVP에서 대표 문장 하나만 표시한다.

## 4. Review Queue

한 번에 한 문장만 표시하기 때문에 다른 중요한 원칙이 영구적으로 가려지는 문제를 해결하기 위해 `Review Queue`를 둔다.

Review Queue는 무작위 회전 기능이 아니다.

목적은 사용자가 오래 확인하지 않은 중요한 원칙을 앱 내부에서 다시 만날 수 있게 하는 것이다.

P0에서 최소 지원한다.

- 마지막 의미 확인 시점 저장
- 오래 확인하지 않은 retained 원칙 표시
- `아직 중요한가요?`
- `지금의 말로 다시 쓰기`
- `계속 유지`, `일시 중지`, `종료` 동작

자동 알림과 정교한 재노출 스케줄링은 P1로 둘 수 있다.

현재 대표 문장 선택 알고리즘에서 `최근 확인한 항목일수록 계속 우선`하는 자기강화 규칙은 사용하지 않는다.

## 5. 회고는 부정적인 경험에 한정하지 않는다

`ReflectionItem`은 다음 종류를 모두 지원한다.

- regret
- win
- desire
- discovery
- turning_point
- insight

제품은 `고쳐야 할 것`과 `이미 잘하고 있어서 유지할 것`을 동일하게 중요한 학습으로 본다.

모든 ReflectionItem이 행동으로 이어져야 하는 것은 아니다.

## 6. 기록과 행동 결정 시점을 분리한다

사용자는 평소 `CaptureEntry`로 한 줄만 저장할 수 있다.

여러 기록을 나중에 모아 새 의미를 발견하면 `SynthesisInsight`를 만든다.

허용 흐름:

```text
CaptureEntry 여러 개
→ SynthesisInsight
→ Motive / Vision / Goal / Practice / Commitment 중 필요한 것으로 연결
```

인사이트가 생겨도 행동으로 연결하도록 강제하지 않는다.

## 7. 블록 기반 연결 UX

내부 Why Graph는 사용자에게 관계 테이블이나 그래프 용어로 노출하지 않는다.

P0에서는 `Focus Board + Block Tray`를 제공한다.

사용자는 블록을 드래그하여 의미가 맞는 슬롯에 놓을 수 있다.

예시 슬롯:

- 왜?
- 어떤 미래를 위해?
- 무엇을 위해?
- 어디서 시작됐지?

유효하지 않은 타입의 연결은 스냅되지 않는다.

드래그 앤 드롭은 유일한 조작법이 아니다. VoiceOver 및 기타 접근성을 위해 동일 결과를 만드는 탭 기반 연결 흐름을 반드시 제공한다.

전체 무한 캔버스 `Meaning Map`은 P1로 둔다.

## 8. 중복 노드와 병합

데이터가 장기간 쌓이면 비슷한 의미의 노드가 여러 개 생기는 것을 정상 상황으로 간주한다.

예시:

- 경제적 자유
- 돈 때문에 선택을 포기하지 않는 삶
- 경제적 선택권

사용자가 동일하거나 사실상 같은 개념이라고 판단하면 병합할 수 있어야 한다.

### 병합 원칙

- 과거 OriginMoment는 삭제하지 않는다.
- 과거 관계와 생성 시각을 보존한다.
- 현재 대표 노드를 하나 정한다.
- 병합된 노드는 alias 또는 merged 상태로 남긴다.
- 기존 Provenance와 MeaningCheckIn을 잃지 않는다.

P0 데이터 모델은 병합 이력을 나중에 추가할 수 있도록 식별자를 안정적으로 유지한다. 병합 UI는 P1이어도 된다.

## 9. 종료는 실패가 아니다

Goal, Practice, Commitment, Motive, Vision을 현재 상태에서 종료할 때 단순 `retired`만 저장하지 않는다.

종료 이유를 구분한다.

```ts
export type RetirementReason =
  | 'achieved'
  | 'no_longer_wanted'
  | 'values_changed'
  | 'superseded'
  | 'deferred'
  | 'context_changed'
  | 'other';
```

필요하면 사용자가 종료 시점의 메모를 남길 수 있다.

이 기록은 나중에 `왜 그만뒀지?`를 복구할 수 있어야 한다.

## 10. 소스 오브 트루스

Why Graph가 도입된 이후 Commitment를 별도 독립 원본 엔티티로 중복 관리하지 않는다.

권장 구조를 확정한다.

- 공통 노드 원본: `MeaningNode`
- 종류별 속성: 1:1 Detail 모델
- 의미 관계: `MeaningRelation`
- 회고·기록·인사이트 출처: `ProvenanceLink`
- 최초 시점: `OriginMoment`
- 의미 재평가: `MeaningCheckIn`

`Commitment.reflectionItemId` 같은 단일 직접 FK를 소스 오브 트루스로 사용하지 않는다.

하나의 Commitment는 여러 ReflectionItem, CaptureEntry, SynthesisInsight를 출처로 가질 수 있다.

## 11. Provenance와 의미 관계 분리

`MeaningRelation`은 MeaningNode 사이의 관계만 담당한다.

ReflectionItem, CaptureEntry, SynthesisInsight 등의 출처 연결은 `ProvenanceLink`로 관리한다.

```ts
export type ProvenanceSourceType =
  | 'reflection_item'
  | 'capture_entry'
  | 'synthesis_insight'
  | 'origin_moment'
  | 'meaning_check_in';
```

이 규칙으로 기존 `derived_from` 스키마 불일치를 해결한다.

## 12. MeaningCheckIn 대상

MeaningCheckIn은 노드뿐 아니라 관계에도 적용할 수 있어야 한다.

예를 들어 `돈 모으기`라는 Goal 전체가 아니라 `또래보다 뒤처지고 싶지 않아서`라는 특정 Motive 연결만 더 이상 중요하지 않게 될 수 있다.

```ts
subjectType: 'node' | 'relation';
subjectId: string;
```

이를 통해 관계 단위의 `reaffirmed`, `reframed`, `weakened`, `retired`, `uncertain` 이력을 저장한다.

## 13. 잠금화면 메시지 길이 분리

하나의 문장을 모든 출력에 공통 사용하지 않는다.

필요하면 다음 표현을 분리한다.

- 내부 전체 의미: Commitment 본문
- 잠금화면 이미지용: `wallpaperMessage`
- 작은 Widget용: `widgetMessage`
- 공개 승인 기준 원문: `publicSafeMessage`

MVP에서는 사용자가 동일 문장을 여러 출력에 재사용할 수 있지만 데이터 구조는 분리 가능하게 설계한다.

## 14. 백업과 복원

자동 클라우드 백업은 기본적으로 제외한다.

그러나 이 제품은 시간이 지날수록 데이터 가치가 커지므로 수동 백업을 너무 늦게 두지 않는다.

### 확정 방향

- 개발 초기에는 로컬 전용
- 데이터 모델이 안정되는 즉시 암호화된 수동 내보내기와 복원을 구현 우선순위 상향
- 평문 JSON을 최종 사용자 기본 백업 파일로 사용하지 않음
- 디버그용 JSON export가 필요하면 개인 실데이터에 사용하지 않고 개발 빌드에 한정

백업 포맷에는 스키마 버전을 포함한다.

## 15. 공개 Git 저장소 규칙

현재 GitHub 저장소는 Public이다.

따라서 다음은 절대 커밋하지 않는다.

- 실제 사용자 SQLite DB
- 실제 앱 export 파일
- 개인 회고 원문이 포함된 fixture
- 실사용 잠금화면 스크린샷 중 개인 텍스트가 보이는 이미지
- 개인 데이터가 포함된 로그

테스트 데이터는 완전히 가상의 내용만 사용한다.

`.gitignore`와 개발 문서에도 이 규칙을 반영한다.

## 16. 구현 우선순위에 미치는 영향

### P0 데이터

- CaptureEntry
- ReflectionItem 및 ReflectionItemKind
- SynthesisInsight
- MeaningNode
- 종류별 Detail
- MeaningRelation
- ProvenanceLink
- OriginMoment
- MeaningCheckIn의 node/relation 대상 지원
- LockscreenProjection
- Review 상태를 저장할 최소 필드
- 안정적인 식별자 및 스키마 버전

### P0 UI

- 빠른 기록 중심 홈
- 현재 대표 잠금화면 문장
- Focus Board
- Block Tray
- DnD 연결 + 탭 기반 연결
- Synthesis 생성
- Why Trail
- 의미 다시 확인하기
- 공개용 잠금화면 문장 승인
- Review Queue 최소 UI

### P1

- 전체 Meaning Map
- 중복 노드 병합 UI
- FocusWindow
- 정교한 Review Queue 스케줄링
- 암호화 내보내기와 복원은 데이터 모델 안정 직후 우선 구현하며, 장기 사용 테스트 전에 완료한다.

## 17. 구현 시작 전 남은 결정

핵심 제품 구조와 개인정보 경계는 확정되었다.

구현 시작을 막는 제품 결정은 현재 없다.

남은 비차단 결정:

- 실제 앱 표시 이름
- 구체적인 로컬 DB 라이브러리
- 백업 암호화 포맷과 키 처리 방식
- Widget과 wallpaper 문장 길이 제한값

이 항목은 각 구현 단계에서 최신 플랫폼 상태와 라이브러리를 검토하여 확정한다.
