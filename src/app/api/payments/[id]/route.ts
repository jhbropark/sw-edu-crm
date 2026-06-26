import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const p = await prisma.payment.findUnique({ where: { id: params.id }, include: { contact: true } });
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({
    paymentId: p.id, orderId: p.id,
    orderName: "SW 교육 수강료", amount: p.amount,
    customerName: p.contact.name, customerEmail: p.contact.email ?? undefined,
  });
}
