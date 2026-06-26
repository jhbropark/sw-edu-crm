import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Input = z.object({
  contactId: z.string().min(1),
  amount: z.number().int().positive(),
  orderName: z.string().min(1),       // 결제창에 표시할 상품명
  enrollmentId: z.string().optional(),
});

// 리드 카드 '결제 링크 생성' 버튼이 호출. orderId = Payment.id 를 그대로 사용.
export async function POST(req: NextRequest) {
  const parsed = Input.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { contactId, amount, orderName, enrollmentId } = parsed.data;
  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact) return NextResponse.json({ error: "고객을 찾을 수 없습니다." }, { status: 404 });

  const payment = await prisma.payment.create({
    data: { contactId, amount, provider: "toss", status: "PENDING", enrollmentId },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return NextResponse.json({
    paymentId: payment.id,
    orderId: payment.id,           // 토스 orderId (멱등 키)
    orderName,
    amount,
    customerName: contact.name,
    customerEmail: contact.email ?? undefined,
    checkoutUrl: `${base}/checkout?paymentId=${payment.id}`, // 카톡으로 보낼 결제 링크
  });
}
