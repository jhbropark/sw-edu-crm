import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTossPayment, verifyTossWebhookSignature } from "@/lib/toss";
import { sendReceipt } from "@/lib/solapi";

// 토스 결제 웹훅. 보안 3중 방어:
//  (1) 서명검증(HMAC) — 위조 차단
//  (2) 토스 API 재조회 — 페이로드 신뢰하지 않고 권위 상태 사용
//  (3) 멱등 처리 — 동일 이벤트 재수신 시 중복 반영 방지
export async function POST(req: NextRequest) {
  const raw = await req.text(); // 서명검증 위해 raw body 그대로 사용
  const signature = req.headers.get("tosspayments-webhook-signature");

  // 운영 환경: 서명검증 강제. (개발 중 시크릿 없으면 ALLOW_UNVERIFIED_WEBHOOK=1 로 우회)
  const verified = verifyTossWebhookSignature(raw, signature);
  if (!verified && process.env.ALLOW_UNVERIFIED_WEBHOOK !== "1") {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: any;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  // 토스 웹훅 페이로드에서 paymentKey/orderId 추출(이벤트 타입별 위치 상이 대응)
  const data = event.data ?? event;
  const paymentKey: string | undefined = data.paymentKey;
  const orderId: string | undefined = data.orderId;
  if (!paymentKey || !orderId) return NextResponse.json({ ok: true }); // 처리 대상 아님 → 200으로 재전송 방지

  const payment = await prisma.payment.findUnique({ where: { id: orderId }, include: { contact: true } });
  if (!payment) return NextResponse.json({ ok: true }); // 우리 주문 아님

  // (2) 권위 데이터 재조회
  const authoritative = await getTossPayment(paymentKey);
  if (authoritative.totalAmount !== payment.amount) {
    return NextResponse.json({ error: "amount mismatch" }, { status: 400 });
  }

  const statusMap: Record<string, "PAID" | "REFUNDED" | "PARTIAL_REFUND" | "FAILED"> = {
    DONE: "PAID", CANCELED: "REFUNDED", PARTIAL_CANCELED: "PARTIAL_REFUND",
    ABORTED: "FAILED", EXPIRED: "FAILED",
  };
  const next = statusMap[authoritative.status];
  if (!next) return NextResponse.json({ ok: true });

  // (3) 멱등: 이미 같은 상태면 종료
  if (payment.status === next) return NextResponse.json({ ok: true });

  await prisma.payment.update({
    where: { id: orderId },
    data: {
      status: next,
      method: authoritative.method ?? payment.method,
      providerTxId: paymentKey,
      paidAt: next === "PAID" ? new Date(authoritative.approvedAt ?? Date.now()) : payment.paidAt,
      receiptUrl: authoritative.receipt?.url ?? payment.receiptUrl,
      refundedAt: next === "REFUNDED" || next === "PARTIAL_REFUND" ? new Date() : payment.refundedAt,
    },
  });

  if (next === "PAID") {
    await prisma.lead.updateMany({
      where: { contactId: payment.contactId, stage: { notIn: ["WON", "LOST"] } },
      data: { stage: "WON" },
    });
    if (payment.contact.phone) {
      sendReceipt(payment.contact.phone, payment.contact.name, payment.amount).catch((e) => console.error(e));
    }
  }
  return NextResponse.json({ ok: true });
}
