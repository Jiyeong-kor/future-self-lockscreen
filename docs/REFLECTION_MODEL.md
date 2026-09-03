# 회고 입력 모델 설계 이력

이 문서는 더 이상 구현 기준이 아닙니다.

후회에 한정하지 않는 ReflectionItemKind와 회고 입력 철학은 v1.0 PRD와 canonical schema에 통합되었습니다.

현재 구현에서는 다음 문서를 따릅니다.

1. [`PRD.md`](PRD.md)
2. [`DOMAIN_SCHEMA.md`](DOMAIN_SCHEMA.md)
3. [`DATA_LIFECYCLE_SECURITY.md`](DATA_LIFECYCLE_SECURITY.md)

현재 ReflectionItem은 stable object와 immutable revision으로 분리되어 과거 출처가 소급 변경되지 않도록 설계합니다.

이전 상세 초안은 Git history에 설계 이력으로 남아 있습니다.
