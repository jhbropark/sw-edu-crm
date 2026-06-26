"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100">
      로그아웃
    </button>
  );
}
