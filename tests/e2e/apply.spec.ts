import { test, expect } from "@playwright/test";

test("공개 신청 폼은 로그인 없이 접근 가능하고 제출된다", async ({ page }) => {
  await page.goto("/apply");
  await expect(page.getByRole("heading", { name: "수업 문의/신청" })).toBeVisible();

  await page.getByLabel(/이름/).fill("방문자");
  await page.getByLabel(/연락처/).fill("010-9999-0000");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "신청하기" }).click();

  await expect(page.getByText("신청이 접수되었습니다")).toBeVisible();
});

test("동의 없이 제출하면 막힌다", async ({ page }) => {
  await page.goto("/apply");
  await page.getByLabel(/이름/).fill("방문자");
  await page.getByLabel(/연락처/).fill("010-9999-0001");
  await page.getByRole("button", { name: "신청하기" }).click();
  await expect(page.getByText("개인정보 수집·이용 동의가 필요합니다.")).toBeVisible();
});
