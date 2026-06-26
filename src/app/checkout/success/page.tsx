"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SuccessPage() {
  const params = useSearchParams();
  const [status, setStatus] = useState<"loading" | "ok" | "fail">("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const paymentKey = params.get("paymentKey");
    const orderId = params.get("orderId");
    const amount = params.get("amount");
    if (!paymentKey || !orderId || !amount) { setStatus("fail"); setMsg("필수 값 누락"); return; }

    fetch("/api/payments/confirm", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    })
      .then(async (r) => { if (!r.ok) throw new Error((await r.json()).error); setStatus("ok"); })
      .catch((e) => { setStatus("fail"); setMsg(String(e.message ?? e)); });
  }, [params]);

  return (
    <div className="mx-auto max-w-md p-10 text-center">
      {status === "loading" && <p>결제를 확인하는 중…</p>}
      {status === "ok" && <><h1 className="text-2xl font-bold text-green-600">결제 완료</h1><p className="mt-2 text-gray-600">수강 신청이 확정되었습니다.</p></>}
      {status === "fail" && <><h1 className="text-2xl font-bold text-red-600">결제 확인 실패</h1><p className="mt-2 text-gray-600">{msg}</p></>}
    </div>
  );
}
