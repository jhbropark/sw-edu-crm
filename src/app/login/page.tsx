"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { makeT, normalizeLocale } from "@/lib/i18n";

function LoginForm() {
  const params = useSearchParams();
  const locale = normalizeLocale(params.get("lang"));
  const t = makeT(locale);
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await signIn("credentials", { email, password, redirect: false, callbackUrl });
    setLoading(false);
    if (res?.error) setError(t("login.error"));
    else window.location.href = callbackUrl;
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm rounded-lg border bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-xl font-bold">{t("login.title")}</h1>
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex flex-col gap-1">
          <label htmlFor="l-email">{t("login.email")}</label>
          <input id="l-email" type="email" autoComplete="username" value={email}
            onChange={(e) => setEmail(e.target.value)} className="rounded border px-3 py-2" autoFocus />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="l-pass">{t("login.password")}</label>
          <input id="l-pass" type="password" autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)} className="rounded border px-3 py-2" />
        </div>
        {error && <p className="text-red-600" role="alert">{error}</p>}
        <button type="submit" disabled={loading} className="rounded bg-black py-2 text-white disabled:opacity-50">
          {loading ? t("login.submitting") : t("login.submit")}
        </button>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Suspense><LoginForm /></Suspense>
    </div>
  );
}
