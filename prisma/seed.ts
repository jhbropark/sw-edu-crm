import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("changeme123!", 10); // 첫 로그인 후 변경
  const owner = await prisma.user.upsert({
    where: { email: "owner@varis.kr" },
    update: { passwordHash },
    create: { email: "owner@varis.kr", name: "강사", role: "OWNER", passwordHash },
  });
  console.log("로그인 계정: owner@varis.kr / changeme123!");
  const staffHash = await bcrypt.hash("staff123!", 10);
  await prisma.user.upsert({
    where: { email: "staff@varis.kr" },
    update: { passwordHash: staffHash, role: "STAFF" },
    create: { email: "staff@varis.kr", name: "스태프", role: "STAFF", passwordHash: staffHash },
  });
  console.log("스태프 계정: staff@varis.kr / staff123! (마케팅·내보내기 제외)");

  const python = await prisma.course.create({
    data: { title: "파이썬 입문 8주 과정", format: "HYBRID", price: 350000 },
  });
  await prisma.course.create({
    data: { title: "웹개발 부트캠프(오프라인)", format: "OFFLINE", price: 1200000 },
  });

  // 샘플 리드 몇 건
  await prisma.lead.createMany({
    data: [
      { name: "김민수", phone: "010-1111-2222", source: "instagram", stage: "NEW", interest: "파이썬", ownerId: owner.id },
      { name: "이서연", phone: "010-3333-4444", source: "blog", stage: "CONSULTING", interest: "웹개발", ownerId: owner.id,
        nextActionAt: new Date(Date.now() + 2 * 86400000) },
      { name: "박지훈", phone: "010-5555-6666", source: "referral", stage: "PROPOSAL", interest: "파이썬", ownerId: owner.id },
    ],
  });

  // 전환된 고객 + 결제
  const contact = await prisma.contact.create({
    data: { name: "최유라", phone: "010-7777-8888", tags: ["python-basic"], consentAt: new Date(), consentCh: "alimtalk" },
  });
  const enrollment = await prisma.enrollment.create({
    data: { contactId: contact.id, courseId: python.id, status: "active", startAt: new Date() },
  });
  await prisma.payment.create({
    data: {
      contactId: contact.id, amount: 350000, status: "PAID", method: "card",
      provider: "toss", paidAt: new Date(), enrollmentId: enrollment.id,
    },
  });

  // 샘플 캠페인: 수강 완료 90일 후 다음 과정 안내 (알림톡 2스텝)
  await prisma.campaign.create({
    data: {
      name: "수료 90일 후 다음 과정", channel: "alimtalk",
      trigger: "enrollment.completed+90d", status: "draft",
      steps: { create: [
        { order: 0, delayDays: 0, template: "tpl_next_course" },
        { order: 1, delayDays: 7, template: "tpl_next_course_reminder" },
      ] },
    },
  });

  await prisma.appSetting.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", businessName: "OOO SW 교육", defaultChannel: "alimtalk", retentionDays: 365 },
  });

  console.log("Seed 완료");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
