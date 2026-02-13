# Cloudflare Worker Secret 인식 문제 트러블슈팅

## 문제 상황

**일시**: 2026-01-07

**증상**:
- `wrangler secret put`으로 설정한 secret이 Worker에서 `undefined`로 반환
- `/health` 엔드포인트에서 `env_status`가 모두 `false`
- `wrangler secret list`에서는 secret이 존재하는 것으로 표시

## 디버깅 과정

### 1. Secret 설정 확인

```bash
CLOUDFLARE_API_TOKEN="토큰" npx wrangler secret list
```

**결과**: Secret 목록에 정상적으로 표시됨
```json
[
  {"name": "AIRTABLE_TOKEN", "type": "secret_text"},
  {"name": "TELEGRAM_BOT_TOKEN", "type": "secret_text"},
  ...
]
```

### 2. Worker 재배포 시도

```bash
CLOUDFLARE_API_TOKEN="토큰" npx wrangler deploy
```

**결과**: 배포 성공했지만 `/health`에서 여전히 `false`

### 3. Secret 재설정으로 해결

```bash
# echo로 값을 파이프하여 secret 재설정
echo "토큰값" | CLOUDFLARE_API_TOKEN="토큰" npx wrangler secret put AIRTABLE_TOKEN
```

**결과**: Secret 재설정 후 즉시 인식됨

## 근본 원인 분석

### 가능한 원인들

1. **대화형 입력 vs 파이프 입력**
   - 이전 설정: `wrangler secret put AIRTABLE_TOKEN` (대화형 입력)
   - 해결 방법: `echo "값" | wrangler secret put AIRTABLE_TOKEN` (파이프 입력)
   - Windows Git Bash 환경에서 대화형 입력이 제대로 처리되지 않을 수 있음

2. **Secret 값 인코딩 문제**
   - 대화형 입력 시 특수문자나 줄바꿈이 추가될 수 있음
   - 파이프 입력은 정확한 값만 전달

3. **Cloudflare 전파 지연**
   - Secret 설정 후 Edge 노드로 전파되는 시간 필요
   - 일반적으로 몇 초 ~ 몇 분 소요

4. **캐시 문제**
   - Worker가 이전 설정을 캐시하고 있을 수 있음
   - 재배포 또는 secret 재설정으로 캐시 무효화

## 해결 방법

### 권장 방식: 파이프로 Secret 설정

```bash
# 올바른 방법 (Windows/Git Bash 환경)
echo "secret_value" | CLOUDFLARE_API_TOKEN="토큰" npx wrangler secret put SECRET_NAME
```

### 확인 명령어

```bash
# Secret 목록 확인
CLOUDFLARE_API_TOKEN="토큰" npx wrangler secret list

# Worker health check로 env 상태 확인
curl "https://worker-name.subdomain.workers.dev/health"
```

## 예방책

1. **Secret 설정 시 항상 파이프 사용**
   ```bash
   echo "$VALUE" | wrangler secret put KEY_NAME
   ```

2. **설정 후 즉시 /health 확인**
   ```bash
   curl "https://worker.workers.dev/health" | grep env_status
   ```

3. **문제 발생 시 재설정 시도**
   - 단순 재배포보다 secret 재설정이 더 효과적

## 참고 사항

- Cloudflare Workers Secret은 암호화되어 저장됨
- `wrangler secret list`는 값이 아닌 이름만 표시
- Secret은 Worker 코드에서 `env.SECRET_NAME`으로 접근
- wrangler.toml의 `[vars]`는 비밀이 아닌 환경변수에만 사용

---

*최종 수정: 2026-01-07*
