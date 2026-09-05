# Future Self

> 내가 무엇을 해야 하는지가 아니라, 왜 그걸 하기로 했는지를 잊지 않게 해주는 앱

평소의 생각과 회고를 쌓고, 시간이 지나 서로 연결하거나 종합하면서 내가 무엇을 왜 중요하게 생각하는지 이해하고, 최초의 이유와 이후의 의미 변화까지 다시 찾을 수 있게 하는 개인 의미 관리 앱입니다.

잠금화면은 제품 전체가 아니라 사용자가 직접 선택하고 공개 승인한 원칙을 일상에 투영하는 출력 지점입니다.

## 현재 상태

제품 요구사항, 장기 데이터 구조, 정보 구조와 핵심 사용자 흐름의 구현 기준선이 정리되었고 실제 앱 구현을 시작했습니다.

현재 코드 상태:

- React Native 0.87.0 Community CLI 프로젝트 초기화 완료
- iOS / Android 네이티브 프로젝트 골격 생성 완료
- TypeScript 도메인 계층 구현 시작
- 분류되지 않은 Meaning Card 정식 지원
- causal provenance cycle 검증
- 의미 관계 적격성 검증
- 의미 카드 merge cycle 검증
- 잠금화면 공개 승인 상태 검증
- Review resurfacing 제외 및 snooze 적격성 검증
- 위 규칙에 대한 단위 테스트 추가
- GitHub Actions 기반 typecheck / test / lint CI 구성

다음 구현 축은 로컬 DB와 migration 기반, repository 경계, 빠른 기록 저장 흐름입니다.

## 구현 기준 문서

다음 세 문서가 구현 규칙의 최상위 기준입니다.

1. [PRD v1.1](docs/PRD.md)
2. [Canonical Domain Schema](docs/DOMAIN_SCHEMA.md)
3. [데이터 생명주기와 보안 규칙 v1.1](docs/DATA_LIFECYCLE_SECURITY.md)

UX 구현 기준:

- [정보 구조](docs/INFORMATION_ARCHITECTURE.md)
- [핵심 사용자 흐름](docs/USER_FLOWS.md)
- [화면 상태와 예외 UX](docs/SCREEN_STATES.md)

제품 경험 안전 규칙:

- [잠금화면 승인과 의미 재확인 정책](docs/LOCKSCREEN_APPROVAL_POLICY.md)
- [복귀와 재노출 안전 정책](docs/RETURN_AND_RESURFACING_POLICY.md)
- [현재 수익화 정책](docs/MONETIZATION_POLICY.md)

기존 설계 문서와 충돌하면 최상위 기준 문서를 따릅니다.

## 정보 구조

현재 최상위 탐색은 다음 네 영역으로 설계합니다.

```text
홈 | 기록 | 의미 | 설정
```

- 홈: 한 줄 빠른 기록, 현재 잠금화면 문장, 최근 기록, 소수 Review, 선택적 이전 맥락
- 기록: 타임라인, 통합 검색, 회고, Synthesis를 위한 같이 보기
- 의미: Meaning Card, Why Trail, Focus Board, 갈등 검토, 후속 Meaning Map
- 설정: 앱 잠금, 알림, Widget 안내, 백업/복원/export, 재노출 제외, 시스템 통합

회고, Synthesis, 시간 여행, 전체 Meaning Map은 최상위 탭으로 올리지 않고 필요한 순간에만 진입합니다.

## 기본 방향

- React Native Community CLI + TypeScript
- iOS 우선, WidgetKit 포함
- local-first
- 현재 완전 무료, 결제·구독·광고 없음
- 제품 내 AI 기능 없음
- 빠른 기록 중심 홈
- 기록 시 분류, 연결, 목표화, 행동화를 강제하지 않음
- 후회뿐 아니라 잘한 점, 욕망, 발견, 전환점, 깨달음을 기록
- 여러 기록을 나중에 묶어 새 인사이트를 만드는 Synthesis
- Synthesis를 행동으로 연결하지 않아도 완결된 정상 상태
- 분류되지 않은 Meaning Card를 영구적인 정상 상태로 허용
- 사용자가 원할 때 `이유`, `미래상`, `목표`, `실천`, `원칙`으로 분류
- Motive, Vision, Goal, Practice, Commitment 다대다 연결
- 갈등은 `conflicts_with`로 보존하고 필요할 때만 선택적 Trade-off Reflection
- 모든 수정은 revision으로 보존하여 과거 근거가 소급 변경되지 않도록 처리
- 특정 시점의 생각과 연결 상태를 다시 보는 시간 여행
- 장기 기록을 다시 찾는 통합 검색과 필터
- causal provenance cycle 방지
- Focus Board와 Block Tray 기반 연결 UX
- Drag and Drop과 동등한 탭 기반 접근성 흐름
- 그래프 완성도, 연결 개수, 미분류 개수, Inbox Zero를 성취로 만들지 않음
- 사용자의 자기해석이나 정체성 단정을 제품이 교정하지 않음
- 사용자가 직접 선택한 대표 잠금화면 문장만 사용
- 잠금화면에는 명시적으로 승인한 공개용 Projection만 표시
- 공개 문장 내용 변경, 스타일 변경, 의미 재확인을 서로 분리
- 의미 재확인을 주기적으로 강제하지 않음
- 일반 과거 기록이나 민감한 기억을 임의로 resurfacing하지 않음
- 장기간 사용하지 않아도 정상 사용으로 취급
- 복귀 시 밀린 작업을 만들지 않음
- Private Store와 Widget App Group 데이터 분리
- iOS Private Store와 검색 인덱스에 강한 Data Protection 적용
- 선택적 Face ID, Touch ID 또는 시스템 인증 기반 앱 잠금
- 중복 의미 병합 시 과거 관계를 재작성하지 않고 canonical node로 resolve
- 종료 이유와 삭제를 구분
- 암호화 수동 백업과 검증 후 원자적 복원
- 선택한 기록을 사람이 읽을 수 있는 형태로 내보내는 데이터 이동권
- 개인 원문을 Spotlight에 자동 색인하지 않음
- 실제 실행 일정은 사용자가 원할 때 Reminders, Calendar, Shortcuts 등 외부 실행 도구와 연결
- Future Self 자체는 할 일 또는 습관 추적 앱으로 확장하지 않음
- 장기적으로 프라이버시를 보존하는 멀티디바이스 지원
- 장기 사용을 가정한 대규모 합성 데이터 성능 검증
- Android는 공통 도메인 안정화 이후 후속 지원

## 설계 이력 문서

다음 문서는 현재 구조에 도달한 과정과 세부 아이디어를 보존하는 참고 자료입니다. 구현 규칙의 최종 권위는 아닙니다.

- [v0.4 제품 규칙](docs/PRODUCT_RULES_V04.md)
- [Why Graph 초기 설계](docs/WHY_GRAPH.md)
- [회고 입력 모델 설계](docs/REFLECTION_MODEL.md)
- [누적 기록과 2차 인사이트 모델](docs/SYNTHESIS_MODEL.md)
- [블록 기반 연결 UX](docs/BLOCK_CANVAS.md)
- [제품 결정 상태](docs/OPEN_DECISIONS.md)
- [1차 레드팀 검토](docs/RED_TEAM_REVIEW.md)
- [2차 레드팀 검토](docs/RED_TEAM_REVIEW_V2.md)
- [제품 기획 레드팀 검토](docs/RED_TEAM_PRODUCT_STRATEGY_V1.md)

## Public 저장소 주의

이 저장소에는 실제 개인 회고 데이터, 실사용 SQLite DB, 실제 export 파일, 개인 원문 fixture, 개인 텍스트가 노출된 스크린샷, 암호화 키를 커밋하지 않습니다. 테스트와 문서 예시는 가상 데이터를 사용합니다.
