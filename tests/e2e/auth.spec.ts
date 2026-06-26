import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("비로그인 시 보호 페이지 접근하면 로그인으로 이동", async ({ page }) => {
  await page.goto("/leads");
  await expect(page).toHaveURL(/\/login/);
});

test("시드 계정으로 로그인하면 대시보드가 보인다", async ({ page }) => {
  await login(page);
  await expect(page.getByText("이번 달 매출")).toBeVisible();
});

test("잘못된 비밀번호는 오류 메시지", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("이메일").fill("owner@varis.kr");
  await page.getByLabel("비밀번호").fill("wrong-pass");
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page.getByText("이메일 또는 비밀번호가 올바르지 않습니다.")).toBeVisible();
});
