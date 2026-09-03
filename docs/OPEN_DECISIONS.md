# Future Self Lockscreen 제품 결정 상태

- 최근 갱신: 2026-09-04
- 상태: 구현을 막는 제품 결정 없음
- 권위 문서: `docs/PRODUCT_RULES_V04.md`

기존 PRD와 충돌하는 경우 `PRODUCT_RULES_V04.md`를 우선한다.

## 확정된 결정

### D-01. 1차 대상 플랫폼

**확정: iOS 우선**

공통 도메인과 UI 구조를 먼저 iOS에서 완성한 뒤 Android를 후속 지원한다.

### D-02. iOS WidgetKit

**확정: 첫 MVP에 포함**

잠금화면에서 지속적으로 문장을 보게 하는 것이 핵심이므로 이미지 생성과 WidgetKit을 함께 제공한다.

### D-03. 잠금화면 대표 문장

**확정: 한 번에 가장 중요한 문장 하나**

무작위 회전은 사용하지 않는다.

다른 중요한 원칙이 영구적으로 가려지는 문제는 별도의 `Review Queue`로 해결한다.

### D-04. 장기 보존 정책

**확정: 중요한 원칙은 기본적으로 장기 보존**

다만 `상시 보존`과 `현재 잠금화면 노출`을 같은 개념으로 취급하지 않는다.

- retained
- eligibleForLockscreen
- activeAnchor

를 분리한다.

### D-05. FocusWindow

**확정: 특정 날짜나 월은 노출의 절대 조건이 아니라 우선순위를 높이는 보조 신호로 사용**

정교한 FocusWindow는 P1에서 구현한다.

### D-06. 데이터 백업

**확정: 자동 클라우드 백업 제외**

다만 장기 사용 데이터 손실 위험 때문에 데이터 모델 안정 직후 암호화된 수동 내보내기와 복원을 우선 구현한다.

평문 JSON은 최종 사용자 기본 백업 포맷으로 사용하지 않는다.

### D-07. React Native 프로젝트 형태

**확정: React Native Community CLI + TypeScript**

Widget Extension, App Group, Android Kotlin 네이티브 모듈을 직접 구성한다.

### D-08. 초기 공개 범위

**확정: 본인 사용 MVP로 먼저 검증**

다만 데이터 모델과 화면 문구는 특정 개인, 편입, 수능에 종속하지 않는다.

### D-09. 문장 작성 방식

**확정: 질문형 입력 가이드 + 사용자 직접 작성**

MVP에서는 AI가 사용자의 욕망, 후회, 가치관, 행동 원칙을 대신 생성하지 않는다.

### D-10. 잠금화면 배경

**확정: 단색 + 사용자가 사진 보관함에서 선택한 이미지**

현재 기기의 기존 잠금화면 배경을 앱이 자동으로 읽어 재사용하는 기능은 핵심 요구사항으로 두지 않는다.

### D-11. 회고 범위

**확정: 후회 전용이 아님**

ReflectionItem은 다음을 모두 다룬다.

- regret
- win
- desire
- discovery
- turning_point
- insight

모든 기록을 행동 원칙으로 바꾸도록 강제하지 않는다.

### D-12. 평소 기록과 2차 인사이트

**확정: 빠른 기록과 Synthesis 지원**

사용자는 평소 생각을 한 줄만 저장할 수 있다.

여러 기록이 쌓인 뒤 함께 보면서 `SynthesisInsight`를 만들고, 그 시점에 필요하면 Motive, Vision, Goal, Practice, Commitment로 연결한다.

### D-13. 그래프 연결 UX

**확정: P0 Focus Board + Block Tray**

스크래치처럼 블록을 드래그하여 의미 있는 슬롯에 붙인다.

드래그 앤 드롭과 동일 결과를 만드는 탭 기반 접근성 흐름을 반드시 제공한다.

전체 무한 캔버스 Meaning Map은 P1이다.

### D-14. 기본 진입점

**확정: 빠른 기록 중심 홈**

연말 회고는 주요 기능이지만 기본 첫 화면으로 강제하지 않는다.

홈은 다음을 우선한다.

1. 현재 대표 잠금화면 문장
2. 한 줄 빠른 기록
3. 최근 기록
4. Review Queue
5. 회고 진입점

### D-15. 잠금화면 개인정보 경계

**확정: 사용자가 명시적으로 승인한 공개용 문장만 잠금화면에 표시**

내부 Why Graph의 개인 원문을 자동으로 잠금화면에 사용하지 않는다.

`publicSafeMessage`와 `approvedForLockscreen` 상태를 별도로 관리한다.

App Group에는 전체 개인 데이터베이스가 아니라 현재 위젯 표시에 필요한 최소 Projection만 공유한다.

### D-16. Review Queue

**확정: P0 최소 기능 포함**

현재 대표 문장에 밀려 오랫동안 확인하지 못한 중요한 원칙을 다시 검토할 수 있게 한다.

P0 최소 기능:

- 마지막 의미 확인 시점
- 아직 중요한지 재확인
- 현재 표현으로 다시 쓰기
- 유지, 일시 중지, 종료

### D-17. 중복 개념

**확정: 병합 가능 구조**

비슷한 MeaningNode가 여러 개 생기는 것을 정상 상황으로 본다.

병합 시 과거 OriginMoment, Provenance, 관계 이력은 삭제하지 않는다.

병합 UI는 P1이어도 되지만 P0 데이터 모델은 안정적인 ID와 병합 이력을 수용할 수 있어야 한다.

### D-18. 목표와 원칙의 종료

**확정: 종료를 실패로 취급하지 않음**

종료 이유를 구분한다.

- achieved
- no_longer_wanted
- values_changed
- superseded
- deferred
- context_changed
- other

### D-19. 데이터 소스 오브 트루스

**확정: Why Graph 중심으로 통합**

- 공통 원본: MeaningNode
- 종류별 속성: Detail 모델
- 노드 간 의미 연결: MeaningRelation
- 회고·기록·인사이트 출처: ProvenanceLink
- 최초 시점: OriginMoment
- 의미 재평가: MeaningCheckIn

`Commitment.reflectionItemId` 같은 단일 FK를 원본 관계로 사용하지 않는다.

### D-20. MeaningCheckIn 대상

**확정: 노드와 관계 모두 가능**

하나의 Goal 전체가 아니라 특정 Motive 연결만 약해지거나 재해석될 수 있기 때문에 관계 단위의 의미 변화도 기록한다.

## 아직 미확정이지만 구현을 막지 않는 항목

### 실제 앱 표시 이름

저장소 이름 `future-self-lockscreen`은 유지한다.

실제 홈 화면과 향후 App Store 표시 이름은 UI 디자인 단계에서 확정한다.

### 로컬 DB 라이브러리

SQLite 계열 관계형 저장소를 기본 방향으로 하되 구현 시작 시 React Native 최신 생태계와 유지보수 상태를 확인해 선택한다.

### 백업 암호화 포맷

암호화된 수동 백업을 제공한다는 제품 결정은 확정했다. 구체적인 포맷과 키 처리 방식은 보안 설계 단계에서 정한다.

### Widget 및 wallpaper 문장 길이

출력별 문장 필드를 분리 가능한 구조로 만들고 실제 글자 제한은 실기기 테스트에서 결정한다.

## 구현 시작 가능 여부

**가능함.**

현재 구현을 시작하기 위해 추가로 반드시 받아야 하는 제품 결정은 없다.
