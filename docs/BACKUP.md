# 백업 / 복구 절차

고객 개인정보·결제 기록을 다루므로 백업은 필수입니다. 두 축으로 운영하세요: **(1) 관리형 자동 백업(Supabase)** + **(2) 주기적 자체 덤프(오프사이트 보관)**.

---

## 1. Supabase 관리형 백업

- **자동 일일 백업**: 유료 플랜에서 매일 자동 백업 제공. Project → Database → Backups에서 확인/복원.
- **PITR(Point-in-Time Recovery)**: 상위 플랜에서 특정 시점으로 복구. 실수로 대량 삭제/병합했을 때 유용.
- 복원은 콘솔에서 스냅샷 선택 → Restore. 복원 시 다운타임이 있으니 점검 공지 후 진행.

> 권장: 최소 일일 백업 + 가능하면 PITR. 보관 기간은 플랜 정책 확인.

---

## 2. 자체 덤프 (오프사이트)

콘솔 백업 외에 별도 위치(다른 클라우드 스토리지/로컬)에도 보관하면 안전합니다.

### 전체 덤프 (직결 URL 사용)
```bash
# DIRECT_URL(5432, 직결) 사용. 풀러(6543)로는 pg_dump 불안정.
pg_dump "$DIRECT_URL" -Fc -f backup_$(date +%Y%m%d).dump
```

### 복구
```bash
# 빈 DB에 복구 (주의: 기존 데이터 덮어쓰기)
pg_restore --clean --if-exists --no-owner -d "$DIRECT_URL" backup_YYYYMMDD.dump
```

### 스키마만 / 데이터만
```bash
pg_dump "$DIRECT_URL" --schema-only -f schema.sql
pg_dump "$DIRECT_URL" --data-only -Fc -f data.dump
```

### 특정 테이블만 (예: leads, payments)
```bash
pg_dump "$DIRECT_URL" -Fc -t leads -t payments -f core_$(date +%Y%m%d).dump
```

---

## 3. 자동화 (선택)

- GitHub Actions에 **주간 덤프 워크플로**를 두고, 결과 파일을 별도 스토리지(예: Cloudflare R2/S3)에 업로드.
- 비밀은 GitHub Secrets(`DIRECT_URL`, 스토리지 키)로 주입. 덤프 파일은 암호화 보관 권장.

예시 cron: 매주 일요일 새벽
```yaml
on:
  schedule:
    - cron: "0 18 * * 0"   # 일 18:00 UTC = 월 03:00 KST
```

---

## 4. 복구 리허설 (분기 1회 권장)

백업은 "복구가 되어야" 백업입니다. 분기마다:

1. 별도 **테스트 DB**에 최신 덤프 복구
2. `npx prisma migrate status`로 스키마 정합성 확인
3. 앱을 테스트 DB로 띄워 로그인·리드·결제 조회가 정상인지 확인
4. 소요 시간(RTO)과 데이터 손실 허용폭(RPO) 기록

---

## 5. 운영 체크리스트

- [ ] Supabase 자동 백업 활성화 + 보관기간 확인
- [ ] 주간 자체 덤프 + 오프사이트 업로드
- [ ] 덤프 파일 암호화/접근통제
- [ ] 분기 1회 복구 리허설
- [ ] 마이그레이션 배포 전 즉석 덤프(`pg_dump`) 1회
- [ ] 개인정보 파기 크론(⑯)과 백업 보관기간 정책 정합성 점검

---

## 6. 비상 시나리오별 대응

| 상황 | 대응 |
|---|---|
| 실수로 리드 대량 삭제/병합 | PITR로 직전 시점 복구 또는 최신 덤프에서 해당 테이블만 복구 |
| 마이그레이션 사고 | 배포 전 덤프로 롤백 → 스키마 수정 후 재적용 |
| DB 비밀번호 유출 | Supabase에서 비밀번호 회전 → Vercel 환경변수 갱신 → 재배포 |
| 전체 장애 | 신규 프로젝트에 최신 덤프 복구 → `DATABASE_URL` 교체 → 재배포 |
