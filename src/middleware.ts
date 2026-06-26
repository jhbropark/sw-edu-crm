import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// authConfig.callbacks.authorized 가 공개/보호 경로를 판단
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
