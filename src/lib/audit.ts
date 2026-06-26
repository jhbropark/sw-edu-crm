import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type AuditOpts = { entity?: string; entityId?: string; meta?: unknown };

// 감사 로그 기록. 베스트 에포트(실패해도 본 요청을 막지 않음).
export async function audit(action: string, opts: AuditOpts = {}) {
  try {
    const session = await auth();
    await prisma.auditLog.create({
      data: {
        actorId: (session?.user as any)?.id ?? null,
        actorEmail: session?.user?.email ?? null,
        action,
        entity: opts.entity ?? null,
        entityId: opts.entityId ?? null,
        meta: opts.meta !== undefined ? JSON.stringify(opts.meta) : null,
      },
    });
  } catch (e) {
    console.error("audit 실패", e);
  }
}
