import { auth } from "@/auth";
import { NextResponse } from "next/server";

// 로그인 필수. 미인증이면 401 Response 반환(라우트에서 그대로 return).
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }), session: null };
  }
  return { error: null, session };
}

// OWNER 권한 필수. 아니면 403.
export async function requireOwner() {
  const { error, session } = await requireUser();
  if (error) return { error, session: null };
  if ((session!.user as any).role !== "OWNER") {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}
