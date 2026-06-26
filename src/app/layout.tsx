import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import SignOutButton from "@/components/SignOutButton";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = { title: "SW 교육 CRM", description: "1인 강사용 CRM" };

const nav = [
  { href: "/", label: "대시보드", ownerOnly: false },
  { href: "/leads", label: "리드·영업", ownerOnly: false },
  { href: "/payments", label: "결제·매출", ownerOnly: false },
  { href: "/campaigns", label: "마케팅", ownerOnly: true },
  { href: "/audit", label: "감사 로그", ownerOnly: true },
  { href: "/settings", label: "설정", ownerOnly: true },
  { href: "/help", label: "도움말", ownerOnly: false },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as any)?.role;

  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {session?.user ? (
          <div className="flex min-h-screen flex-col md:flex-row">
            <Sidebar
              nav={nav.filter((n) => !n.ownerOnly || role === "OWNER")}
              email={session.user.email ?? ""}
              role={role ?? ""}
              signOut={<SignOutButton />}
            />
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
