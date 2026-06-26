import Link from "next/link";

export const dynamic = "force-static";

const sections: { title: string; body: string; href?: string }[] = [
  { title: "1. 기본 설정", body: "설정에서 상호·발신정보·개인정보 보관기간을 먼저 입력하세요.", href: "/settings" },
  { title: "2. 리드 받기", body: "공개 신청폼(/apply) 링크를 블로그·인스타에 게시하면 문의가 자동으로 리드로 쌓입니다. 직접 추가도 가능합니다.", href: "/leads" },
  { title: "3. 영업 관리", body: "칸반에서 카드를 드래그해 단계를 옮기고, 상세에서 상담 기록과 다음 연락일을 남기세요.", href: "/leads" },
  { title: "4. 결제 받기", body: "고객을 결제 단계로 옮기고 결제 링크를 카톡으로 보냅니다. 결제 완료는 웹훅으로 자동 반영됩니다.", href: "/payments" },
  { title: "5. 마케팅 자동화", body: "캠페인을 만들고 트리거(수료 90일 후 등)를 걸면, 예약 메시지가 자동 발송됩니다.", href: "/campaigns" },
  { title: "6. 증빙", body: "결제 건에서 현금영수증을 즉시 발급하거나 세금계산서 발행을 요청할 수 있습니다.", href: "/payments" },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-bold">도움말</h1>
      <div className="space-y-4">
        {sections.map((s) => (
          <div key={s.title} className="rounded-lg border bg-white p-4">
            <h2 className="text-sm font-semibold">{s.title}</h2>
            <p className="mt-1 text-sm text-gray-600">{s.body}</p>
            {s.href && <Link href={s.href} className="mt-2 inline-block text-xs text-blue-600 hover:underline">바로가기 →</Link>}
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-gray-400">자세한 운영 문서: README · DEPLOY · docs/ALIMTALK · docs/BACKUP</p>
    </div>
  );
}
