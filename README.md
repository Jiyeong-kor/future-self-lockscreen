# Future Self Lockscreen

과거에 반복했던 후회를 현재의 행동 기준으로 바꾸고, 사용자가 스스로에게 해주고 싶은 말을 잠금화면에서 자주 보게 만드는 React Native 앱입니다.

단순한 목표 목록이 아니라 사용자가 어떤 행동을 왜 중요하게 생각했는지, 그 이유가 다른 목표와 어떻게 연결되는지, 시간이 지나 그 의미가 어떻게 바뀌었는지까지 축적하는 구조를 지향합니다.

회고는 후회만 기록하지 않습니다. 잘해서 유지하고 싶은 선택, 새롭게 발견한 욕망과 가치, 방향을 바꾼 전환점과 깨달음도 Why Graph의 출발점으로 보존합니다.

## 현재 상태

현재 저장소는 제품 기획 단계입니다. 구현 코드는 아직 추가하지 않았습니다.

- 제품 요구사항 문서: [`docs/PRD.md`](docs/PRD.md)
- 복합 동기와 초심 이력 도메인 설계: [`docs/WHY_GRAPH.md`](docs/WHY_GRAPH.md)
- 회고 입력 모델 설계: [`docs/REFLECTION_MODEL.md`](docs/REFLECTION_MODEL.md)
- 제품 결정 상태: [`docs/OPEN_DECISIONS.md`](docs/OPEN_DECISIONS.md)
- PRD 레드팀 검토: [`docs/RED_TEAM_REVIEW.md`](docs/RED_TEAM_REVIEW.md)
- 구현 시작 예정: 2026년 9월 5일 빅데이터분석기사 필기시험 이후

## 기본 방향

- React Native Community CLI + TypeScript
- iOS 우선, WidgetKit 포함
- 서버 없이 로컬 저장 중심의 MVP
- 회고에서 필요한 경우 변화 원칙을 만들고 잠금화면에서 상시 노출
- 후회뿐 아니라 잘한 점, 욕망, 발견, 전환점, 깨달음을 회고 데이터로 보존
- 목표, 동기, 미래상, 실천을 다대다로 연결하는 Why Graph
- 최초 결심과 이후 의미 변화 기록을 덮어쓰지 않고 시간순으로 보존
- iOS는 잠금화면용 이미지 생성과 WidgetKit을 지원
- Android는 후속으로 잠금화면 배경 직접 적용을 지원

## 문서

- [PRD](docs/PRD.md)
- [Why Graph 도메인 설계](docs/WHY_GRAPH.md)
- [회고 입력 모델 설계](docs/REFLECTION_MODEL.md)
- [제품 결정 상태](docs/OPEN_DECISIONS.md)
- [PRD 레드팀 검토](docs/RED_TEAM_REVIEW.md)
