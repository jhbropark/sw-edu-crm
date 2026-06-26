import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmTossPayment } from "@/lib/toss";
import { sendReceipt } from "@/lib/solapi";

export async function POST(req: NextRequest) {
  const { paymentKey, orderId, amount } = await req.json();
  if (!paymentKey || !orderId || !amount) {
    return NextResponse.json({ error: "필수 값 누락" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { id: orderId }, include: { contact: true } });
  if (!payment) return NextResponse.json({ error: "주문 없음" }, { status: 404 });
  if (payment.amount !== Number(amount)) {
    return NextResponse.json({ error: "금액 불일치" }, { status: 400 });
  }
  if (payment.status === "PAID") return NextResponse.json({ ok: true }); // 멱등 처리

  const result = await confirmTossPayment({ paymentKey, orderId, amount: Number(amount) });

  await prisma.payment.update({
    where: { id: orderId },
    data: {
      status: "PAID", method: result.method ?? null,
      providerTxId: result.paymentKey, paidAt: new Date(result.approvedAt ?? Date.now()),
      receiptUrl: result.receipt?.url ?? null,
    },
  });
  await prisma.lead.updateMany({
    where: { contactId: payment.contactId, stage: { notIn: ["WON", "LOST"] } },
    data: { stage: "WON" },
  });

  // 결제 안내 알림톡(베스트 에포트)
  if (payment.contact.phone) {
    sendReceipt(payment.contact.phone, payment.contact.name, payment.amount)
      .catch((e) => console.error("receipt 실패", e));
  }
  return NextResponse.json({ ok: true });
}
