# SW 교육 CRM

1인/프리랜서 SW 교육 강사를 위한 올인원 CRM. 문의 유입부터 영업·결제·증빙·마케팅 자동화까지 한 곳에서.

**스택:** Next.js (App Router) · TypeScript · Prisma · PostgreSQL · Auth.js · Tailwind CSS
**연동:** 토스페이먼츠(결제·현금영수증) · SOLAPI(알림톡/문자) · Resend(이메일)

---

## 핵심 기능

| 영역 | 기능 |
|---|---|
| 리드·영업 | 공개 신청폼(`/apply`), 칸반 파이프라인(드래그), 리드 상세·상담 타임라인, 후속 알림 |
| 결제·매출 | 토스 결제링크·웹훅 동기화(서명검증), 매출 대시보드(월별·전환율), 환불 동기화 |
| 증빙 | 영수증 URL 저장, 현금영수증 실발급, 세금계산서 요청 |
| 마케팅 | 캠페인 빌더(트리거→예약 큐), 알림톡·문자·이메일 발송 |
| 운영 | 인증/역할(OWNER·STAFF), 관리자 설정, CSV 내보내기, 개인정보 자동 파기 |
| 품질 | Playwright E2E, Vitest 단위테스트, GitHub Actions CI |

---

## 빠른 시작

```bash
npm install
cp .env.example .env        # DATABASE_URL 등 채우기
npx prisma migrate dev      # 스키마 적용
npm run db:seed             # 시드 (계정/샘플)
npm run dev                 # http://localhost:3000
```

시드 계정: OWNER `owner@varis.kr / changeme123!` · STAFF `staff@varis.kr / staff123!`

### 스크립트
```
npm run dev | build | start
npm run db:push | db:migrate | db:seed | db:studio
npm run test          # Vitest 단위테스트
npm run test:e2e      # Playwright E2E (DB 시드 필요)
```

---

## 폴더 구조

```
src/
├─ app/
│  ├─ page.tsx                 대시보드(지표+차트)
│  ├─ leads/                   칸반 + 리드 상세([id])
│  ├─ payments/                결제·매출 + 증빙
│  ├─ campaigns/               마케팅 캠페인(OWNER)
│  ├─ settings/                관리자 설정(OWNER)
│  ├─ apply/                   공개 신청폼
│  ├─ checkout/                고객 결제 페이지
│  ├─ login/                   로그인
│  └─ api/                     leads · payments · campaigns · export ·
│                              settings · public · cron · auth
├─ components/                 LeadBoard, LeadFormModal, LeadActivity,
│                              CampaignBuilder, DashboardCharts, TaxActions,
│                              SettingsForm, SignOutButton
├─ lib/                        prisma, auth(.config), authz, toss, solapi,
│                              email, campaigns, campaign-trigger, analytics,
│                              csv, privacy, settings, i18n
└─ middleware.ts               엣지 인증/권한 가드
prisma/                        schema.prisma, seed.ts
tests/e2e/                     Playwright
src/lib/__tests__/             Vitest 단위테스트
docs/                          ALIMTALK.md, ARCHITECTURE.md
DEPLOY.md                      Vercel+Supabase 배포 가이드
```

---

## 데이터 모델 (요약)

`User` · `Lead` · `Contact` · `Course` · `Enrollment` · `Payment` · `Activity` · `Campaign`/`CampaignStep` · `ScheduledMessage` · `AppSetting`

- Lead와 Contact 분리 → 영업 깔때기 + 고객 LTV 동시 분석
- Payment에 영수증/세무 필드 포함, ScheduledMessage에 `dedupeKey`로 중복 적재 방지

전체 스키마는 `prisma/schema.prisma`, 다이어그램은 `docs/ARCHITECTURE.md` 참고.

---

## 크론 (vercel.json)

| 경로 | 주기 | 역할 |
|---|---|---|
| `/api/cron/evaluate-campaigns` | 매시 | 트리거 평가 → 예약 큐 적재 |
| `/api/cron/send-scheduled` | 15분 | 예약 메시지 발송(알림톡/문자/이메일) |
| `/api/cron/purge-personal-data` | 매일 04:00 | 보관기간 만료 PII 파기 |

모두 `Authorization: Bearer $CRON_SECRET` 필요.

---

## 보안·컴플라이언스

- 비밀키(`TOSS_SECRET_KEY`, `SOLAPI_API_SECRET`, `RESEND_API_KEY`)는 서버 전용
- 결제 웹훅 3중 방어: 서명검증 → 토스 재조회 → 멱등 처리
- 역할 기반 접근제어(OWNER 전용: 마케팅·설정·내보내기)
- 개인정보: 동의 수집, 보관기간 자동 파기(결제 이력은 법정 보존)

---

## 문서

- `DEPLOY.md` — 배포(단계별)
- `docs/ARCHITECTURE.md` — 시스템·데이터·플로우 다이어그램
- `docs/ALIMTALK.md` — 알림톡 템플릿 등록

내부 운영용 스캐폴딩. 결제·메시지·세무 연동은 각 서비스 콘솔의 키·승인·웹훅 설정 후 동작합니다.

---

## ㉑–㉓ 품질·국제화 (추가)

### 단위 테스트 (Vitest)
- `npm run test` — 순수 로직 검증(트리거 파싱·발송시각·큐 윈도우·CSV·보관기간 cutoff)
- 테스트 용이성을 위해 순수 함수 분리: `lib/campaign-trigger.ts`, `lib/retention.ts`, `lib/csv.ts`
- CI에 단위테스트 단계 포함

### 다국어 (i18n)
- `src/lib/i18n.ts` — ko/en 사전 + `makeT(locale)`
- 공개 페이지에서 `?lang=en`으로 전환(`/apply?lang=en`, `/login?lang=en`)
- 운영 텍스트는 점진적으로 사전화 가능

### 접근성 (a11y)
- 모든 입력에 `<label htmlFor>` 연결, 필수항목 `aria-required`
- 오류 메시지 `role="alert"`, 완료 안내 `role="status" aria-live`
- 허니팟 `aria-hidden`, 시맨틱 버튼 `type` 명시, `inputMode/autoComplete` 지정

---

## ㉔–㉖ 실시간·감사·실험 (추가)

### 라이브 대시보드
- `src/lib/stats.ts` + `/api/stats` + `src/components/LiveStats.tsx`
- 30초 자동 새로고침(끄기/켜기 토글), 마지막 갱신 시각 표시

### 감사 로그(Audit Log)
- `prisma`: `AuditLog` 모델 / `src/lib/audit.ts` — `audit(action, {entity,entityId,meta})`
- 기록 이벤트: 리드 단계변경, 캠페인 생성·상태변경, 설정 변경, 증빙 발행
- `/audit` 조회 페이지(OWNER 전용), 세션에 `user.id` 추가

### 캠페인 A/B 분기
- `CampaignStep.variant`("A"/"B"/공통), 빌더에서 스텝별 선택
- `assignVariant(contactId, variants)` — 결정적 배정(같은 사람=같은 그룹, 균등 분포)
- 큐 적재 시 배정된 variant 스텝만 발송. 단위테스트 `ab.test.ts` 포함

---

## ㉗–㉙ 운영 편의 (추가)

### 일일 다이제스트 메일
- `src/lib/digest.ts` + `/api/cron/daily-digest` — OWNER 전원에게 어제 신규리드/매출, 결제대기, 오늘 연락할 사람 요약 발송
- 크론: 매일 23:00 UTC(= 08:00 KST). Resend 사용

### 리드 중복 병합
- `src/lib/dedupe.ts` — 전화/이메일 정규화 + Union-Find 그룹핑(전이적 병합), 단위테스트 포함
- `/api/leads/duplicates`(조회), `/api/leads/merge`(병합: 활동 이전·빈필드 보완·WON 우선·메모 합침·감사로그)
- `/leads/duplicates` 페이지(리드 보드 "중복 정리" 링크)

### 대시보드 기간 필터
- `getPeriodStats(days, monthMode)` + `/api/stats/period`
- `PeriodFilter` — 7/30/90일·이번 달 전환, 매출·결제건수·신규리드·전환율 즉시 갱신

---

## ㉚–㉜ UX·운영 안정성 (추가)

### 리드 검색·필터·정렬
- `src/lib/lead-filter.ts` — 검색어(이름/전화/이메일/관심)·유입경로 필터·정렬(최신/오래된/이름/다음연락일), 단위테스트 포함
- 칸반 상단 필터 바에서 즉시 반영(보이는 건수 표시)

### 모바일 반응형
- `src/components/Sidebar.tsx` — 데스크톱 사이드바 / 모바일 햄버거 드로어(현재 메뉴 강조)
- 칸반 모바일 가로 스크롤, 결제·감사 테이블 가로 스크롤 래퍼, 헤더 줄바꿈

### 백업/복구
- `docs/BACKUP.md` — Supabase 자동백업·PITR, pg_dump/restore, 자동화·복구 리허설·비상 시나리오·체크리스트

---

## ㉝–㉟ 완성도 (추가)

### 온보딩·도움말
- `src/components/EmptyState.tsx` — 재사용 빈 상태(설명+액션)
- `src/components/OnboardingChecklist.tsx` — 대시보드 시작 가이드(설정/리드/결제/캠페인, 완료 시 자동 숨김)
- `src/app/help/page.tsx` — 단계별 도움말, 내비 "도움말"

### 성능 최적화
- 인덱스: `Lead.createdAt`, `Contact.phone/email`, `Payment.createdAt`, `Activity(leadId,createdAt)`
- 페이지네이션: 결제(20)·감사 로그(30) — `Pagination` 컴포넌트, `?page=` 기반
- 스키마 변경 → `npx prisma migrate dev --name perf-indexes`

### 접근성 자동 감사(axe)
- `tests/e2e/a11y.spec.ts` — `@axe-core/playwright`로 로그인·신청폼·대시보드·리드 스캔
- serious/critical 위반을 실패로 처리. `npm run test:a11y`, CI(test:e2e)에 포함
