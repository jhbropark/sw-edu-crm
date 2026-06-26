import { prisma } from "@/lib/prisma";
import LeadBoard, { type Lead } from "@/components/LeadBoard";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const session = await auth();
  const isOwner = (session?.user as any)?.role === "OWNER";
  const rows = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
  const leads: Lead[] = rows.map((l) => ({
    id: l.id, name: l.name, phone: l.phone, email: l.email,
    source: l.source, interest: l.interest, stage: l.stage,
    nextActionAt: l.nextActionAt ? l.nextActionAt.toISOString() : null,
    createdAt: l.createdAt.toISOString(),
  }));
  return <LeadBoard initialLeads={leads} isOwner={isOwner} />;
}
