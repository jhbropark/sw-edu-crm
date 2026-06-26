import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireOwner } from "@/lib/authz";
import { issueTossCashReceipt } from "@/lib/toss";
import { z } from "zod";
import { audit } from "@/lib/audit";

const ReqInput = z.object({
  taxType: z.enum(["cash_receipt", "tax_invoice"]),
  taxInfo: z.string().min(1), // 현금영수증: 휴대폰/사업자번호, 세금계산서: 사업자번호/상호
  cashReceiptType: z.enum(["소득공제", "지출증빙"]).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireUser();
  if (error) return error;
  const parsed = ReqInput.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const payment = await prisma.payment.findUnique({ where: { id: params.id } });
  if (!payment) return NextResponse.json({ error: "결제 없음" }, { status: 404 });
  if (payment.status !== "PAID") return NextResponse.json({ error: "완료된 결제만 가능" }, { status: 400 });

  // 현금영수증은 토스 API로 즉시 발급 시도
  if (parsed.data.taxType === "cash_receipt") {
    try {
      const result = await issueTossCashReceipt({
        amount: payment.amount, orderId: payment.id, orderName: "SW 교육 수강료",
        customerIdentityNumber: parsed.data.taxInfo.replace(/-/g, ""),
        type: parsed.data.cashReceiptType ?? "소득공제",
      });
      const updated = await prisma.payment.update({
        where: { id: params.id },
        data: {
          taxType: "cash_receipt", taxInfo: parsed.data.taxInfo,
          taxStatus: "issued", taxIssuedAt: new Date(),
          receiptUrl: result.receiptUrl ?? payment.receiptUrl,
        },
      });
      await audit("payment.tax_issue", { entity: "payment", entityId: params.id, meta: { taxType: "cash_receipt" } });
      return NextResponse.json({ ...updated, issued: true });
    } catch (e: any) {
      // 발급 실패 시 요청상태로 기록(수동 처리 가능)
      const updated = await prisma.payment.update({
        where: { id: params.id },
        data: { taxType: "cash_receipt", taxInfo: parsed.data.taxInfo, taxStatus: "requested" },
      });
      return NextResponse.json({ ...updated, issued: false, error: String(e?.message ?? e) }, { status: 502 });
    }
  }

  // 세금계산서는 외부 발행(팝빌 등) → 요청 기록만
  const updated = await prisma.payment.update({
    where: { id: params.id },
    data: { taxType: "tax_invoice", taxInfo: parsed.data.taxInfo, taxStatus: "requested" },
  });
  return NextResponse.json(updated);
}

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireOwner();
  if (error) return error;
  const updated = await prisma.payment.update({
    where: { id: params.id }, data: { taxStatus: "issued", taxIssuedAt: new Date() },
  });
  await audit("payment.tax_issue", { entity: "payment", entityId: params.id, meta: { manual: true } });
  return NextResponse.json(updated);
}
