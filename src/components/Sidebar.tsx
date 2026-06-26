"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };

export default function Sidebar({ nav, email, role, signOut }: {
  nav: NavItem[]; email: string; role: string; signOut: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links = (
    <nav className="flex flex-1 flex-col gap-1">
      {nav.map((n) => {
        const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
        return (
          <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={`rounded px-3 py-2 text-sm ${active ? "bg-gray-100 font-medium" : "hover:bg-gray-100"}`}>
            {n.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* 모바일 상단바 */}
      <header className="flex items-center justify-between border-b bg-white px-4 py-3 md:hidden">
        <span className="text-base font-bold">SW 교육 CRM</span>
        <button onClick={() => setOpen(true)} aria-label="메뉴 열기" className="rounded p-2 hover:bg-gray-100">
          <span className="block h-0.5 w-5 bg-gray-700" />
          <span className="mt-1 block h-0.5 w-5 bg-gray-700" />
          <span className="mt-1 block h-0.5 w-5 bg-gray-700" />
        </button>
      </header>

      {/* 데스크톱 사이드바 */}
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-white p-4 md:flex">
        <div className="mb-6 text-lg font-bold">SW 교육 CRM</div>
        {links}
        <div className="border-t pt-3">
          <div className="px-3 pb-1 text-xs text-gray-400">{email} · {role}</div>
          {signOut}
        </div>
      </aside>

      {/* 모바일 드로어 */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-bold">메뉴</span>
              <button onClick={() => setOpen(false)} aria-label="메뉴 닫기" className="rounded p-1 text-xl">×</button>
            </div>
            {links}
            <div className="border-t pt-3">
              <div className="px-3 pb-1 text-xs text-gray-400">{email} · {role}</div>
              {signOut}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
