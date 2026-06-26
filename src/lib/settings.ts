import { prisma } from "@/lib/prisma";

const SINGLETON_ID = "singleton";

export async function getSettings() {
  const existing = await prisma.appSetting.findUnique({ where: { id: SINGLETON_ID } });
  if (existing) return existing;
  return prisma.appSetting.create({ data: { id: SINGLETON_ID } });
}

// 보관기간: 설정값 우선, 없으면 env, 그래도 없으면 365
export async function getRetentionDays() {
  const s = await prisma.appSetting.findUnique({ where: { id: SINGLETON_ID } });
  return s?.retentionDays ?? Number(process.env.PRIVACY_RETENTION_DAYS ?? 365);
}
