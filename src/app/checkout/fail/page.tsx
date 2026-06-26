"use client";
import { useSearchParams } from "next/navigation";

export default function FailPage() {
  const params = useSearchParams();
  return (
    <div className="mx-auto max-w-md p-10 text-center">
      <h1 className="text-2xl font-bold text-red-600">결제가 취소되었습니다</h1>
      <p className="mt-2 text-gray-600">{params.get("message") ?? "다시 시도해 주세요."}</p>
      <p className="mt-1 text-xs text-gray-400">code: {params.get("code") ?? "-"}</p>
    </div>
  );
}
