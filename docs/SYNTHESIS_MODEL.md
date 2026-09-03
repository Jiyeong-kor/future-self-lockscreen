# 누적 기록과 Synthesis 설계 이력

이 문서는 더 이상 구현 기준이 아닙니다.

빠른 기록, 여러 기록을 함께 본 뒤 만드는 SynthesisInsight, 행동 연결을 강제하지 않는 원칙은 v1.0 기준 문서에 통합되었습니다.

현재 구현에서는 다음 문서를 따릅니다.

1. [`PRD.md`](PRD.md)
2. [`DOMAIN_SCHEMA.md`](DOMAIN_SCHEMA.md)
3. [`DATA_LIFECYCLE_SECURITY.md`](DATA_LIFECYCLE_SECURITY.md)

현재 Synthesis 출처는 단순 source ID가 아니라 당시 immutable revision을 가리키며, Synthesis와 MeaningNode 전체에 걸쳐 causal cycle을 검사합니다.

이전 상세 초안은 Git history에 설계 이력으로 남아 있습니다.
