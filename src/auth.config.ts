import type { NextAuthConfig } from "next-auth";

const PUBLIC_PREFIXES = ["/login", "/api/auth", "/api/payments/webhook", "/api/cron", "/checkout", "/apply", "/api/public"];

// OWNER 전용: 마케팅 캠페인 관리 / 데이터 내보내기
const OWNER_ONLY_PREFIXES = ["/campaigns", "/api/campaigns", "/api/export", "/settings", "/api/settings", "/audit"];

export const authConfig = {
  pages: { signIn: "/login" },
  providers: [], // 실제 provider는 auth.ts 에서 주입(프리즈마 사용은 노드 런타임)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const { pathname } = nextUrl;
      if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
      if (!auth?.user) return false; // 로그인 필요

      const role = (auth.user as any).role;
      if (OWNER_ONLY_PREFIXES.some((p) => pathname.startsWith(p)) && role !== "OWNER") {
        return false; // 권한 없음 → 페이지는 /login(접근거부)로, API는 가드에서 403
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
