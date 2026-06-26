# 배포 가이드 — Vercel + Supabase

1인 운영 기준, 처음부터 `crm.varis.kr` 운영까지 단계별로 정리했습니다. 소요시간 약 30~60분.

---

## 0. 사전 준비

- GitHub 저장소에 코드 push (CI가 자동으로 돕니다)
- 계정: Vercel, Supabase, 토스페이먼츠, SOLAPI, Resend
- 결제·알림톡은 심사/템플릿 승인에 며칠 걸리니 **가장 먼저 신청**하세요

---

## 1. Supabase — 데이터베이스 생성

1. supabase.com → New project 생성 (Region: `Northeast Asia (Seoul)` 권장)
2. 프로젝트 비밀번호를 안전하게 보관
3. Project Settings → Database → **Connection string** 확인. 두 가지를 모두 씁니다:
   - **Pooled (port 6543, pgbouncer)** → 런타임용 `DATABASE_URL`
   - **Direct (port 5432)** → 마이그레이션용 `DIRECT_URL`
4. 권장 형태:
   ```
   DATABASE_URL="postgresql://postgres.xxxx:[PWD]@aws-0-...pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
   DIRECT_URL="postgresql://postgres.xxxx:[PWD]@aws-0-...supabase.com:5432/postgres"
   ```
   > Prisma `schema.prisma`의 datasource에 `directUrl = env("DIRECT_URL")`를 추가하면 풀러 환경에서 마이그레이션이 안정적입니다. (아래 2번에서 적용)

---

## 2. 로컬에서 스키마 적용 (최초 1회)

`.env`에 위 두 URL을 넣고:

```bash
# schema.prisma datasource 블록에 directUrl 추가(아직 없다면)
#   url       = env("DATABASE_URL")
#   directUrl = env("DIRECT_URL")

npx prisma migrate deploy   # 운영 DB에 마이그레이션 반영
npm run db:seed             # 최초 관리자 계정 생성(이후 비밀번호 변경)
```

---

## 3. Vercel — 프로젝트 연결

1. vercel.com → Add New → Project → GitHub 저장소 선택
2. Framework: Next.js (자동 감지). Build Command는 기본값(`npm run build`, 내부에서 `prisma generate` 포함)
3. **Environment Variables** 등록 (Production + Preview):

| 변수 | 값/설명 |
|---|---|
| `DATABASE_URL` | Supabase pooled URL |
| `DIRECT_URL` | Supabase direct URL |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://crm.varis.kr` |
| `NEXT_PUBLIC_APP_URL` | `https://crm.varis.kr` |
| `TOSS_SECRET_KEY` | 토스 라이브 시크릿 |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 토스 라이브 클라이언트 |
| `TOSS_WEBHOOK_SECRET` | 토스 웹훅 시크릿 |
| `SOLAPI_API_KEY` / `SOLAPI_API_SECRET` / `SOLAPI_SENDER` | SOLAPI |
| `KAKAO_PFID` / `KAKAO_TPL_*` | 카카오 발신프로필·템플릿 |
| `RESEND_API_KEY` / `MAIL_FROM` | 이메일 |
| `CRON_SECRET` | 임의 난수 |
| `PRIVACY_RETENTION_DAYS` | 예: `365` (⑯ 파기 기준일) |

> `ALLOW_UNVERIFIED_WEBHOOK`는 운영에서 **설정하지 않음**(서명검증 강제).

4. Deploy 클릭 → 빌드 성공 확인

---

## 4. 도메인 연결 (crm.varis.kr)

1. Vercel → Project → Settings → Domains → `crm.varis.kr` 추가
2. 안내되는 CNAME(또는 A) 레코드를 varis.kr DNS에 등록
3. SSL 자동 발급 대기 → 접속 확인

---

## 5. 크론 확인

`vercel.json`에 등록된 크론이 Vercel에 자동 반영됩니다:

- `/api/cron/evaluate-campaigns` 매시 정각
- `/api/cron/send-scheduled` 15분마다
- `/api/cron/purge-personal-data` 매일 새벽 (⑯에서 추가)

Vercel Cron은 호출 시 `Authorization: Bearer $CRON_SECRET` 헤더를 자동 전송하도록, Project → Settings → Cron에 시크릿이 적용되는지 확인하세요. (헤더 검증을 쓰는 경우 Vercel Cron의 시크릿 설정 또는 `?key=` 방식 중 택1)

---

## 6. 외부 서비스 콜백/웹훅 등록

- **토스페이먼츠 콘솔** → 웹훅 URL: `https://crm.varis.kr/api/payments/webhook`
  - 결제 성공 redirect: `https://crm.varis.kr/checkout/success`, 실패: `.../checkout/fail`
  - 웹훅 시크릿을 콘솔에서 발급받아 `TOSS_WEBHOOK_SECRET`에 반영
- **SOLAPI** → 발신번호 등록, 알림톡 템플릿 승인(거래성부터)
- **Resend** → 도메인 인증(SPF/DKIM) 후 `MAIL_FROM`을 인증 도메인으로

---

## 7. 출시 체크리스트

- [ ] 시드 관리자 비밀번호 변경
- [ ] `/apply` 공개 폼 제출 → 리드 생성 + 자동응답 수신 확인
- [ ] 토스 **테스트 결제** 1건 → 웹훅으로 PAID 반영 확인
- [ ] 환불 1건 → REFUNDED 동기화 확인
- [ ] 캠페인 active 후 평가 크론 → 예약 큐 적재 → 발송 확인
- [ ] STAFF 계정 로그인 시 마케팅·CSV 접근 차단 확인
- [ ] 개인정보처리방침 페이지 게시(수집항목·목적·보유기간·파기)
- [ ] DB 자동 백업 확인(Supabase 백업 정책)

---

## 트러블슈팅

- **마이그레이션이 풀러에서 실패** → `DIRECT_URL`(5432) 사용 확인
- **웹훅 401** → `TOSS_WEBHOOK_SECRET` 불일치 또는 서명 헤더명 상이. 콘솔의 헤더명과 `route.ts`의 `tosspayments-webhook-signature` 대조
- **알림톡 미발송** → 템플릿 미승인. `fallbackText`로 문자 대체발송되는지 확인
- **빌드 시 Prisma 오류** → `npm run build`에 `prisma generate` 포함됐는지 확인(package.json)
