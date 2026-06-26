"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  paymentId: string; status: string; taxType: string | null; taxStatus: string;
  receiptUrl: string | null; isOwner: boolean;
};

const LABEL: Record<string, string> = { none: "미요청", requested: "요청됨", issued: "발행완료" };

export default function TaxActions({ paymentId, status, taxType, taxStatus, receiptUrl, isOwner }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("cash_receipt");
  const [info, setInfo] = useState("");
  const [saving, setSaving] = useState(false);

  async function request() {
    if (!info.trim()) return;
    setSaving(true);
    await fetch(`/api/payments/${paymentId}/tax`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taxType: type, taxInfo: info }),
    });
    setSaving(false); setOpen(false); router.refresh();
  }

  async function markIssued() {
    await fetch(`/api/payments/${paymentId}/tax`, { method: "PATCH" });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      {receiptUrl && <a href={receiptUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">영수증</a>}
      <span className="text-gray-500">{LABEL[taxStatus] ?? taxStatus}{taxType ? `(${taxType === "cash_receipt" ? "현금영수증" : "세금계산서"})` : ""}</span>
      {status === "PAID" && taxStatus === "none" && (
        <button onClick={() => setOpen(true)} className="rounded border px-2 py-0.5">발행요청</button>
      )}
      {isOwner && taxStatus === "requested" && (
        <button onClick={markIssued} className="rounded border px-2 py-0.5">발행완료</button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-lg bg-white p-5 text-sm shadow-lg">
            <h3 className="mb-3 text-base font-bold">증빙 발행 요청</h3>
            <select value={type} onChange={(e) => setType(e.target.value)} className="mb-2 w-full rounded border px-3 py-2">
              <option value="cash_receipt">현금영수증</option>
              <option value="tax_invoice">세금계산서</option>
            </select>
            <input value={info} onChange={(e) => setInfo(e.target.value)}
              placeholder={type === "cash_receipt" ? "휴대폰/현금영수증카드 번호" : "사업자번호 / 상호"}
              className="mb-3 w-full rounded border px-3 py-2" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded border px-3 py-1.5">취소</button>
              <button onClick={request} disabled={saving} className="rounded bg-black px-3 py-1.5 text-white disabled:opacity-50">요청</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
