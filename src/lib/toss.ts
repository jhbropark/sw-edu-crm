import crypto from "crypto";
// 토스페이먼츠 결제 승인 서버 헬퍼.
// 시크릿 키는 절대 클라이언트로 노출하지 않는다.
const TOSS_API = "https://api.tosspayments.com/v1";

function authHeader() {
  const secret = process.env.TOSS_SECRET_KEY ?? "";
  // 토스 규칙: "{secretKey}:" 를 base64 인코딩한 Basic 인증
  const encoded = Buffer.from(`${secret}:`).toString("base64");
  return `Basic ${encoded}`;
}

export async function confirmTossPayment(params: {
  paymentKey: string; orderId: string; amount: number;
}) {
  const res = await fetch(`${TOSS_API}/payments/confirm`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`토스 승인 실패: ${data.code ?? res.status} ${data.message ?? ""}`);
  }
  return data; // { paymentKey, orderId, status, method, totalAmount, approvedAt, ... }
}


// 결제 단건 재조회 — 웹훅 페이로드를 신뢰하지 않고 토스 서버의 권위 데이터로 검증
export async function getTossPayment(paymentKey: string) {
  const res = await fetch(`${TOSS_API}/payments/${encodeURIComponent(paymentKey)}`, {
    headers: { Authorization: authHeader() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`토스 조회 실패: ${data.code ?? res.status}`);
  return data; // { paymentKey, orderId, status, totalAmount, method, approvedAt, cancels, ... }
}

// 웹훅 서명검증: raw body 를 시크릿으로 HMAC-SHA256 → 헤더와 타이밍 안전 비교
export function verifyTossWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.TOSS_WEBHOOK_SECRET;
  if (!secret) return false;        // 시크릿 미설정 시 통과시키지 않음
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// 현금영수증 발급. 토스 cashReceipts API.
//  type: "소득공제"(개인) | "지출증빙"(사업자)
//  registrationNumber: 휴대폰번호(소득공제) 또는 사업자번호(지출증빙)
export async function issueTossCashReceipt(params: {
  amount: number;
  orderId: string;
  orderName: string;
  customerIdentityNumber: string; // 휴대폰/사업자번호
  type?: "소득공제" | "지출증빙";
}) {
  const res = await fetch(`${TOSS_API}/cash-receipts`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: params.amount,
      orderId: params.orderId,
      orderName: params.orderName,
      customerIdentityNumber: params.customerIdentityNumber,
      type: params.type ?? "소득공제",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`현금영수증 발급 실패: ${data.code ?? res.status} ${data.message ?? ""}`);
  return data; // { receiptKey, issueNumber, receiptUrl, ... }
}

export async function cancelTossCashReceipt(receiptKey: string, amount: number) {
  const res = await fetch(`${TOSS_API}/cash-receipts/${encodeURIComponent(receiptKey)}/cancel`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`현금영수증 취소 실패: ${data.code ?? res.status}`);
  return data;
}
