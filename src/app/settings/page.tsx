import { getSettings } from "@/lib/settings";
import SettingsForm from "@/components/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-xl font-bold">설정</h1>
      <SettingsForm initial={{
        businessName: s.businessName ?? "", senderName: s.senderName ?? "",
        senderPhone: s.senderPhone ?? "", defaultChannel: s.defaultChannel,
        retentionDays: s.retentionDays,
      }} />
    </div>
  );
}
