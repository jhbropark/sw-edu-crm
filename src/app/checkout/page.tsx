"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

// 토스 SDK 타입(간략)
declare global {
  interface Window { TossPayments?: any; }
}

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "test_ck_xxx";

type Order = { paymentId: string; orderId: string; orderName: string; amount: number; customerName?: string; customerEmail?: string };

export default function CheckoutPage() {
  const params = useSearchParams();
  const paymentId = params.get("paymentId");
  const [order, setOrder] = useState<Order | null>(null);
  const [ready, setReady] = useState(false);
  const widgetsRef = useRef<any>(null);

  // 1) 주문 정보 로드
  useEffect(() => {
    if (!paymentId) return;
    fetch(`/api/payments/${paymentId}`).then((r) => r.json()).then(setOrder).catch(() => {});
  }, [paymentId]);

  // 2) 토스 SDK 로드 + 위젯 렌더
  useEffect(() => {
    if (!order) return;
    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v2/standard";
    script.onload = async () => {
      const tossPayments = window.TossPayments(CLIENT_KEY);
      const widgets = tossPayments.widgets({ customerKey: order.customerName ?? "ANONYMOUS" });
      widgetsRef.current = widgets;
      await widgets.setAmount({ currency: "KRW", value: order.amount });
      await widgets.renderPaymentMethods({ selector: "#payment-method" });
      await widgets.renderAgreement({ selector: "#agreement" });
      setReady(true);
    };
    document.body.appendChild(script);
    return () => { script.remove(); };
  }, [order]);

  async function pay() {
    if (!order || !widgetsRef.current) return;
    const origin = window.location.origin;
    await widgetsRef.current.requestPayment({
      orderId: order.orderId,
      orderName: order.orderName,
      successUrl: `${origin}/checkout/success`,
      failUrl: `${origin}/checkout/fail`,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
    });
  }

  if (!paymentId) return <p className="p-6">잘못된 접근입니다.</p>;
  if (!order) return <p className="p-6">주문 정보를 불러오는 중…</p>;

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-1 text-xl font-bold">{order.orderName}</h1>
      <p className="mb-4 text-2xl font-semibold">{order.amount.toLocaleString()}원</p>
      <div id="payment-method" />
      <div id="agreement" />
      <button onClick={pay} disabled={!ready}
        className="mt-4 w-full rounded bg-black py-3 text-white disabled:opacity-50">
        {ready ? "결제하기" : "결제창 준비 중…"}
      </button>
    </div>
  );
}
