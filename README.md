# Future Self Lockscreen

과거에 반복했던 후회를 현재의 행동 기준으로 바꾸고, 사용자가 스스로에게 해주고 싶은 말을 잠금화면에서 자주 보게 만드는 React Native 앱입니다.

단순한 목표 목록이 아니라 사용자가 어떤 행동을 왜 중요하게 생각했는지, 그 이유가 다른 목표와 어떻게 연결되는지, 시간이 지나 그 의미가 어떻게 바뀌었는지까지 축적하는 구조를 지향합니다.

회고는 후회만 기록하지 않습니다. 잘해서 유지하고 싶은 선택, 새롭게 발견한 욕망과 가치, 방향을 바꾼 전환점과 깨달음도 Why Graph의 출발점으로 보존합니다.

사용자는 평소 한 줄 기록만 남겨도 됩니다. 여러 기록이 쌓인 뒤 함께 보면서 새로운 인사이트를 만들고, 필요할 때만 목표나 행동 원칙으로 연결할 수 있습니다.

## 현재 상태

현재 저장소는 제품 기획과 핵심 제품 규칙 확정이 완료된 상태입니다. 구현 코드는 아직 추가하지 않았습니다.

- 제품 요구사항 문서: [`docs/PRD.md`](docs/PRD.md)
- 확정된 v0.4 제품 규칙: [`docs/PRODUCT_RULES_V04.md`](docs/PRODUCT_RULES_V04.md)
- 복합 동기와 초심 이력 도메인 설계: [`docs/WHY_GRAPH.md`](docs/WHY_GRAPH.md)
- 회고 입력 모델 설계: [`docs/REFLECTION_MODEL.md`](docs/REFLECTION_MODEL.md)
- 누적 기록과 2차 인사이트 모델: [`docs/SYNTHESIS_MODEL.md`](docs/SYNTHESIS_MODEL.md)
- 블록 기반 연결 UX: [`docs/BLOCK_CANVAS.md`](docs/BLOCK_CANVAS.md)
- 제품 결정 상태: [`docs/OPEN_DECISIONS.md`](docs/OPEN_DECISIONS.md)
- PRD 레드팀 검토: [`docs/RED_TEAM_REVIEW.md`](docs/RED_TEAM_REVIEW.md)
- 구현 시작 예정: 2026년 9월 5일 빅데이터분석기사 필기시험 이후

기존 문서와 충돌하는 제품 규칙이 있으면 `PRODUCT_RULES_V04.md`를 우선합니다.

## 기본 방향

- React Native Community CLI + TypeScript
- iOS 우선, WidgetKit 포함
- 서버 없이 로컬 저장 중심의 MVP
- 홈은 연말 회고가 아니라 빠른 기록 중심
- 회고에서 필요한 경우 변화 원칙을 만들고 잠금화면에서 상시 보존
- 후회뿐 아니라 잘한 점, 욕망, 발견, 전환점, 깨달음을 회고 데이터로 보존
- 여러 기록을 나중에 묶어 2차 인사이트를 만들 수 있는 Synthesis 구조
- 목표, 동기, 미래상, 실천을 다대다로 연결하는 Why Graph
- 스크래치처럼 블록을 드래그해 의미 있는 슬롯에 연결하는 Focus Board
- 최초 결심과 이후 의미 변화 기록을 덮어쓰지 않고 시간순으로 보존
- 잠금화면에는 사용자가 명시적으로 승인한 공개용 문장만 표시
- Widget App Group에는 전체 개인 데이터가 아니라 최소 공개 Projection만 공유
- 하나의 대표 잠금화면 문장과 별도의 Review Queue를 분리
- iOS는 잠금화면용 이미지 생성과 WidgetKit을 지원
- Android는 후속으로 잠금화면 배경 직접 적용을 지원
- 장기 사용 전에 암호화된 수동 백업과 복원을 제공

## 문서

- [PRD](docs/PRD.md)
- [v0.4 제품 규칙](docs/PRODUCT_RULES_V04.md)
- [Why Graph 도메인 설계](docs/WHY_GRAPH.md)
- [회고 입력 모델 설계](docs/REFLECTION_MODEL.md)
- [누적 기록과 2차 인사이트 모델](docs/SYNTHESIS_MODEL.md)
- [블록 기반 연결 UX](docs/BLOCK_CANVAS.md)
- [제품 결정 상태](docs/OPEN_DECISIONS.md)
- [PRD 레드팀 검토](docs/RED_TEAM_REVIEW.md)
