# Future Self 의존성 보안 추적

- 상태: 구현 보안 정책
- 작성일: 2026-09-05
- 적용 대상: JavaScript/React Native production dependency tree

## 1. 목적

`npm audit` 결과를 무시하지 않되, 업스트림에서 수정할 수 없는 취약점 때문에 모든 개발을 영구적으로 차단하지 않는다.

현재 정책은 다음을 구분한다.

1. 직접 의존성 또는 안전한 호환 업그레이드로 해결 가능한 high/critical 취약점
2. 업스트림 패키지에 있고 현재 안전한 비파괴 수정 경로가 없는 취약점

1번은 가능한 즉시 수정한다.

2번은 위협 표면을 제한하고 업스트림 수정 여부를 계속 추적하며, 관련 기능 공개 전에 다시 검증한다.

## 2. 현재 확인된 업스트림 findings

2026-09-05 `npm audit --omit=dev` 기준으로 다음 경로가 확인됐다.

### 2.1 React Navigation URL query parsing 경로

경로:

```text
@react-navigation/native
→ @react-navigation/core
→ query-string
→ decode-uri-component
```

현재 audit 설명:

- malformed percent-encoded input에 대한 denial-of-service
- 현재 audit 기준 fix 없음

현재 완화:

- Future Self는 아직 외부 URL/deep link 입력을 제품 기능으로 노출하지 않는다.
- private entity를 외부 URL로 자동 노출하지 않는다.
- App Intents/Shortcuts 단계 전 URL/deep link 입력 표면을 별도로 재검토한다.

재검토 트리거:

- React Navigation 또는 `query-string` upstream fix 공개
- deep linking 구현 시작
- 공개 배포 준비

### 2.2 React Native / Metro image-size 경로

경로:

```text
react-native
→ @react-native/community-cli-plugin / Metro
→ image-size
```

현재 audit 설명:

- 특정 ICNS/JXL/HEIF 파서에서 infinite-loop denial-of-service
- audit 자동 수정은 React Native 0.87 계열을 0.86 계열로 내리는 breaking downgrade를 제안하므로 적용하지 않음

현재 완화:

- 이 경로는 현재 Metro/toolchain 의존성이다.
- 앱 제품 기능에서 사용자가 임의 이미지 파일을 이 Node parser에 직접 전달하는 흐름은 없다.
- 취약점을 숨기기 위해 React Native 버전을 임의 downgrade하지 않는다.

재검토 트리거:

- React Native/Metro upstream fix
- image import/build pipeline 변경
- 공개 배포 준비

## 3. CI 정책

`Dependency Audit` workflow는 production dependency audit을 계속 실행하고 결과를 로그에 남긴다.

현재 알려진 업스트림 finding 때문에 audit step 자체는 report-only로 둔다.

이것은 취약점 허용을 의미하지 않는다.

새 취약점이 생긴 경우 다음 기준으로 판정한다.

- 직접 의존성에 안전한 patch/minor fix가 있으면 즉시 업데이트
- 보안상 관련 제품 기능을 비활성화할 수 있으면 필요 시 비활성화
- fix가 breaking change라면 호환성/위협 표면을 검토한 뒤 결정
- critical 또는 private-data confidentiality/integrity에 직접 영향이 있으면 공개 배포 차단

## 4. 공개 배포 게이트

공개 배포 전에는 반드시 다시 실행한다.

```text
npm audit --omit=dev
```

그리고 다음을 확인한다.

- high/critical direct dependency 취약점에 안전한 fix가 남아 있지 않은가
- 현재 제품이 취약한 입력 표면을 실제로 노출하는가
- accepted upstream finding의 완화 가정이 여전히 유효한가
- React Native, Metro, React Navigation의 지원 버전에서 fix가 나왔는가

보안 결함이 private record의 기밀성, 무결성, 삭제 보장에 영향을 주면 출시를 진행하지 않는다.

## 5. 금지

- audit를 통과시키기 위해 검증 없이 `npm audit fix --force` 실행
- React Native 핵심 버전을 보안 문맥 없이 임의 downgrade
- 취약점 로그를 없애기 위해 audit workflow 삭제
- 실제 노출되는 취약점을 `upstream`이라는 이유만으로 무시
