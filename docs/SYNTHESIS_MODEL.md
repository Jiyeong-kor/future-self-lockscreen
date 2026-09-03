# 누적 기록과 2차 인사이트 모델

- 문서 상태: Draft v0.1
- 작성일: 2026-09-04
- 관련 문서: `docs/PRD.md`, `docs/REFLECTION_MODEL.md`, `docs/WHY_GRAPH.md`

## 1. 목적

사용자는 어떤 생각을 처음 기록하는 시점에 그 생각이 어떤 행동으로 이어져야 하는지 알지 못할 수 있다.

따라서 Future Self Lockscreen은 다음 흐름을 지원한다.

```text
그때그때 생각을 기록
→ 기록이 시간에 따라 축적됨
→ 여러 기록을 함께 다시 봄
→ 공통 패턴이나 새로운 의미를 발견함
→ 2차 인사이트를 기록함
→ 필요하면 Motive, Vision, Goal, Practice, Commitment로 연결함
→ 잠금화면에 남길 원칙이 생기면 그때 노출함
```

제품은 사용자가 기록하는 순간부터 모든 생각에 목적, 목표, 행동을 요구하지 않는다.

## 2. 핵심 원칙

### 2.1 기록 시점과 의미 발견 시점을 분리한다

처음 기록할 때는 단순한 메모일 수 있다.

예시:

- 요즘 아침에 준비가 자꾸 늦어진다.
- 저녁에 미리 옷을 꺼내두면 다음 날이 편했다.
- 중요한 일정이 있는 날에는 전날 준비한 경우 실수가 적었다.

각 기록을 작성할 때 사용자는 아직 결론을 내리지 않아도 된다.

나중에 세 기록을 함께 보면서 다음과 같은 인사이트를 만들 수 있다.

`나는 아침 의지보다 전날 환경을 준비했을 때 생활이 안정된다.`

이 인사이트에서 다음 Commitment가 생길 수 있다.

`중요한 일은 당일 의지에 맡기지 않고 전날 환경을 준비한다.`

### 2.2 여러 기록에서 하나의 인사이트가 나올 수 있다

하나의 `SynthesisInsight`는 여러 기록을 근거로 가질 수 있다.

### 2.3 하나의 기록은 여러 인사이트에 다시 사용될 수 있다

같은 과거 기록이 나중에 서로 다른 관점의 인사이트에 사용될 수 있다.

예를 들어 `저녁에 미리 준비했더니 아침이 편했다`는 기록은 다음 두 인사이트의 근거가 될 수 있다.

- 환경 설계가 의지보다 중요하다.
- 아침 시간을 보호하려면 전날의 준비가 중요하다.

따라서 기록과 인사이트 관계는 다대다이다.

### 2.4 인사이트가 생겨도 행동으로 강제하지 않는다

사용자는 인사이트를 발견한 뒤 다음 중 하나를 선택할 수 있다.

- 기록만 남긴다.
- 기존 Motive 또는 Vision과 연결한다.
- 새 Motive 또는 Vision을 만든다.
- Goal을 만든다.
- Practice를 만든다.
- Commitment를 만든다.

제품은 `인사이트가 생겼으니 반드시 행동해야 한다`고 강제하지 않는다.

### 2.5 나중에 다시 해석할 수 있다

SynthesisInsight 역시 최종 진리가 아니다.

사용자는 나중에 다음을 기록할 수 있다.

- 여전히 맞다고 생각한다.
- 일부만 맞다고 생각한다.
- 새로운 기록을 보니 해석이 달라졌다.
- 더 이상 중요한 인사이트가 아니다.

## 3. 빠른 기록 `CaptureEntry`

평소 생각을 저장하기 위한 가장 낮은 마찰의 입력 단위이다.

연말 회고 세션을 만들지 않아도 기록할 수 있다.

```ts
export type CaptureEntryKind =
  | 'thought'
  | 'event'
  | 'observation'
  | 'question'
  | 'quote_to_self';

export type CaptureEntry = {
  id: string;
  kind: CaptureEntryKind;
  content: string;
  occurredAt?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};
```

제품 규칙:

- `content`만 입력해도 저장할 수 있어야 한다.
- 태그, 분류, 연결은 모두 선택 사항이다.
- 사용자가 원하면 나중에 ReflectionItem으로 승격하거나 회고 세션에 포함할 수 있다.
- CaptureEntry를 승격해도 최초 원문과 작성 시각은 보존한다.

## 4. 2차 인사이트 `SynthesisInsight`

여러 기록을 함께 본 뒤 사용자가 새롭게 만든 해석이나 결론이다.

```ts
export type SynthesisStatus =
  | 'active'
  | 'uncertain'
  | 'retired';

export type SynthesisInsight = {
  id: string;
  title?: string;
  statement: string;
  context?: string;
  status: SynthesisStatus;
  createdAt: string;
  updatedAt: string;
};
```

`statement`는 사용자가 그 시점에 발견한 핵심 의미를 원문으로 보존한다.

예시:

`내가 원하는 미래를 준비한다는 생각은 건강, 외모 관리, 생활 역량, 재정 준비를 별개의 목표가 아니라 하나의 방향으로 묶어준다.`

## 5. 인사이트 출처 `SynthesisSourceLink`

SynthesisInsight는 여러 종류의 기존 기록에서 만들어질 수 있다.

```ts
export type SynthesisSourceType =
  | 'capture_entry'
  | 'reflection_item'
  | 'meaning_node'
  | 'meaning_check_in'
  | 'synthesis_insight';

export type SynthesisSourceLink = {
  id: string;
  synthesisInsightId: string;
  sourceType: SynthesisSourceType;
  sourceId: string;
  note?: string;
  createdAt: string;
};
```

기존 인사이트를 다시 묶어 더 상위 인사이트를 만들 수 있다.

예시:

```text
인사이트 A: 나는 환경을 미리 준비하면 실행력이 올라간다.
인사이트 B: 중요한 일일수록 시작 비용이 낮아야 꾸준히 한다.

→ 상위 인사이트 C:
나는 의지력보다 실행이 쉬운 환경을 설계하는 방식이 더 잘 맞는다.
```

`SynthesisInsight → SynthesisInsight` 관계에는 순환을 허용하지 않는다. 전체 구조는 DAG가 되도록 검증한다.

## 6. 행동으로 연결하는 구조

SynthesisInsight 자체를 MeaningNode로 취급하지 않는다.

SynthesisInsight는 ReflectionItem과 마찬가지로 의미 그래프의 출처이다.

새 Motive, Vision, Goal, Practice, Commitment가 SynthesisInsight에서 만들어졌다면 `ProvenanceLink`로 출처를 연결한다.

```ts
export type ProvenanceSourceType =
  | 'reflection_item'
  | 'capture_entry'
  | 'synthesis_insight'
  | 'origin_moment'
  | 'meaning_check_in';

export type ProvenanceLink = {
  id: string;
  subjectNodeId: string;
  sourceType: ProvenanceSourceType;
  sourceId: string;
  createdAt: string;
};
```

## 7. 사용자 흐름

### 7.1 평소 기록

1. 사용자가 `생각 기록`을 누른다.
2. 한 문장만 적고 저장할 수 있다.
3. 앱은 목표나 행동 연결을 요구하지 않는다.

### 7.2 기록 모아보기

사용자는 `기록 모아보기` 화면에서 다음 기준으로 기록을 볼 수 있다.

- 최근 기록
- 태그
- 회고 세션
- 연결된 목표 또는 동기
- 아직 아무 의미 그래프에도 연결되지 않은 기록

### 7.3 여러 기록 선택

사용자는 관련 있어 보이는 기록을 여러 개 선택한다.

앱은 다음 질문을 제시한다.

- 이 기록들을 함께 보니 어떤 공통점이 보이나요?
- 이전에는 따로 보였지만 지금은 어떻게 연결되어 보이나요?
- 이 생각이 앞으로의 선택에 영향을 줘야 한다고 느끼나요?

### 7.4 2차 인사이트 저장

사용자가 작성한 답을 `SynthesisInsight`로 저장한다.

선택한 원본 기록은 출처로 연결한다.

### 7.5 행동 연결

앱은 선택적으로 묻는다.

`이 인사이트를 앞으로의 행동이나 목표와 연결하고 싶나요?`

사용자는 `나중에`, `기존 항목과 연결`, `새 항목 만들기` 중 하나를 선택할 수 있다.

## 8. Inbox와 미연결 기록

기록이 많아질수록 아직 아무 의미 그래프에도 연결되지 않은 기록이 생긴다.

이를 실패나 미완료 작업으로 취급하지 않는다.

앱은 `Inbox` 또는 `아직 연결하지 않은 기록`이라는 중립적인 영역에서 보관한다.

사용자는 필요할 때만 다시 검토한다.

## 9. 원문 보존과 역사

SynthesisInsight가 만들어져도 출처 기록의 원문은 수정하거나 삭제하지 않는다.

사용자가 CaptureEntry를 나중에 더 정돈된 ReflectionItem으로 바꾸더라도 다음을 추적할 수 있어야 한다.

```text
최초 빠른 기록
→ 회고에서 다시 해석한 기록
→ 여러 기록을 묶어 만든 SynthesisInsight
→ 그 인사이트에서 나온 Goal 또는 Commitment
→ 이후 의미를 다시 검토한 기록
```

제품의 목표는 현재의 결론만 저장하는 것이 아니라 어떤 기록들이 쌓여서 현재의 결론에 도달했는지를 보존하는 것이다.

## 10. P0와 P1 범위

### P0 데이터 구조

처음부터 다음 엔티티와 관계를 저장할 수 있어야 한다.

- CaptureEntry
- SynthesisInsight
- SynthesisSourceLink
- 확장된 ProvenanceLink
- Synthesis 간 순환 방지

### P0 UI

- 한 문장 빠른 기록
- 미연결 기록 목록
- 여러 기록 선택
- `이 기록들을 함께 보니?` Synthesis 작성
- Synthesis에서 행동 연결 여부 선택
- Synthesis 상세에서 원본 기록 보기

### P1

- 태그별, 시기별 묶음 보기
- 오래된 미연결 기록 재검토
- 여러 Synthesis를 묶어 상위 인사이트 만들기 UI
- Synthesis 의미 재검토

### P2

- 사용자가 요청했을 때만 AI가 비슷한 기록 후보를 제안
- AI가 기존 기록을 요약해 Synthesis 초안을 제안

AI 제안은 항상 사용자가 검토하고 저장해야 하며 자동 확정하지 않는다.

## 11. 핵심 제품 문장

> 모든 생각은 기록하는 순간부터 행동의 이유가 명확할 필요가 없다. 의미는 시간이 지나 여러 기록이 쌓인 뒤 발견될 수 있다.
