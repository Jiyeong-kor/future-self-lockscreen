# Future Self

평소의 생각과 회고를 쌓고, 시간이 지나 서로 연결하거나 종합하면서 내가 무엇을 왜 중요하게 생각하는지 이해하고, 계속 기억하고 싶은 행동 원칙은 잠금화면에 남기는 개인 의미 관리 앱입니다.

사용자는 처음부터 목표나 행동 계획을 정할 필요가 없습니다. 한 줄 기록만 남겨도 되고, 여러 기록이 쌓인 뒤 새로운 인사이트를 만들 수 있습니다. 목표, 동기, 미래상, 실천, 행동 원칙은 다대다로 연결되며 최초의 이유와 이후의 의미 변화도 시간순으로 보존합니다.

## 현재 상태

제품 요구사항과 장기 데이터 구조의 구현 기준선이 확정된 상태입니다. 구현 코드는 아직 추가하지 않았습니다.

구현은 2026년 9월 5일 빅데이터분석기사 필기시험 이후 시작할 예정입니다.

## 구현 기준 문서

다음 세 문서가 현재 구현의 단일 기준입니다.

1. [PRD v1.0](docs/PRD.md)
2. [Canonical Domain Schema](docs/DOMAIN_SCHEMA.md)
3. [데이터 생명주기와 보안 규칙](docs/DATA_LIFECYCLE_SECURITY.md)

기존 설계 문서와 충돌하면 위 순서의 기준 문서를 따릅니다.

## 기본 방향

- React Native Community CLI + TypeScript
- iOS 우선, WidgetKit 포함
- 서버 없이 로컬 저장 중심
- 빠른 기록 중심 홈
- 후회뿐 아니라 잘한 점, 욕망, 발견, 전환점, 깨달음을 기록
- 여러 기록을 나중에 묶어 새 인사이트를 만드는 Synthesis
- Motive, Vision, Goal, Practice, Commitment를 다대다로 연결하는 Why Graph
- 모든 수정은 revision으로 보존하여 과거 근거가 소급 변경되지 않도록 처리
- Synthesis와 MeaningNode 전체에 걸친 causal provenance cycle 방지
- Focus Board와 Block Tray 기반의 블록 연결 UX
- Drag and Drop과 동등한 탭 기반 접근성 흐름 제공
- 최초 결심과 의미 변화 기록 보존
- 사용자가 직접 선택한 대표 잠금화면 문장만 사용
- 잠금화면에는 사용자가 명시적으로 승인한 공개용 Projection만 표시
- Private Store와 Widget App Group 데이터 분리
- iOS Private Store에 강한 Data Protection 적용
- 하나의 대표 문장과 부담을 주지 않는 Review Resurfacing 분리
- 중복 의미 병합 시 과거 관계를 재작성하지 않고 canonical node로 resolve
- 종료 이유와 삭제를 구분
- 암호화 수동 백업과 검증 후 원자적 복원
- Android는 공통 도메인 안정화 이후 후속 지원

## 설계 이력 문서

다음 문서는 제품이 현재 구조에 도달한 과정과 세부 아이디어를 보존하는 참고 자료입니다. 구현 규칙의 최종 권위는 아닙니다.

- [v0.4 제품 규칙](docs/PRODUCT_RULES_V04.md)
- [Why Graph 초기 설계](docs/WHY_GRAPH.md)
- [회고 입력 모델 설계](docs/REFLECTION_MODEL.md)
- [누적 기록과 2차 인사이트 모델](docs/SYNTHESIS_MODEL.md)
- [블록 기반 연결 UX](docs/BLOCK_CANVAS.md)
- [제품 결정 상태](docs/OPEN_DECISIONS.md)
- [1차 레드팀 검토](docs/RED_TEAM_REVIEW.md)
- [2차 레드팀 검토](docs/RED_TEAM_REVIEW_V2.md)

## Public 저장소 주의

이 저장소에는 실제 개인 회고 데이터, 실사용 SQLite DB, 실제 export 파일, 개인 원문 fixture, 개인 텍스트가 노출된 스크린샷, 암호화 키를 커밋하지 않습니다. 테스트와 문서 예시는 가상 데이터를 사용합니다.
