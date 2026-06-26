import { Page, expect } from "@playwright/test";

export const SEED_EMAIL = process.env.E2E_EMAIL ?? "owner@varis.kr";
export const SEED_PASSWORD = process.env.E2E_PASSWORD ?? "changeme123!";

export async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("이메일").fill(SEED_EMAIL);
  await page.getByLabel("비밀번호").fill(SEED_PASSWORD);
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
}
