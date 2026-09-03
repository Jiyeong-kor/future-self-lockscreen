# Why Graph 초기 설계 이력

이 문서는 더 이상 구현 기준이 아닙니다.

복합 동기, 다대다 의미 연결, OriginMoment, MeaningCheckIn, Why Trail의 핵심 아이디어는 v1.0 기준 문서에 통합되었습니다.

현재 구현에서는 다음 문서를 따릅니다.

1. [`PRD.md`](PRD.md)
2. [`DOMAIN_SCHEMA.md`](DOMAIN_SCHEMA.md)
3. [`DATA_LIFECYCLE_SECURITY.md`](DATA_LIFECYCLE_SECURITY.md)

현재 스키마에서는 MeaningNode와 MeaningRelation을 사용하고, 기록 출처는 MeaningRelation이 아니라 revision을 고정하는 causal evidence 모델로 분리합니다.

이전 상세 초안은 Git history에 설계 이력으로 남아 있습니다.
