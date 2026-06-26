import { prisma } from "@/lib/prisma";
import CampaignBuilder, { type Campaign } from "@/components/CampaignBuilder";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const rows = await prisma.campaign.findMany({
    include: { steps: { orderBy: { order: "asc" } } }, orderBy: { createdAt: "desc" },
  });
  const campaigns: Campaign[] = rows.map((c) => ({
    id: c.id, name: c.name, channel: c.channel, trigger: c.trigger, status: c.status,
    steps: c.steps.map((s) => ({ id: s.id, order: s.order, delayDays: s.delayDays, template: s.template })),
  }));
  return <CampaignBuilder initial={campaigns} />;
}
