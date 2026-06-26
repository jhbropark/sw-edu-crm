import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("리드를 추가하면 신규 컬럼에 카드가 생긴다", async ({ page }) => {
  await login(page);
  await page.goto("/leads");

  const name = `테스트리드_${Date.now()}`;
  await page.getByRole("button", { name: "+ 리드 추가" }).click();
  await page.getByPlaceholder("홍길동").fill(name);
  await page.getByPlaceholder("010-0000-0000").fill("010-1234-5678");
  await page.getByPlaceholder("파이썬 입문").fill("파이썬");
  await page.getByRole("button", { name: "추가" }).click();

  await expect(page.getByText(name)).toBeVisible();
});

test("리드 상세로 이동해 상담 기록을 추가한다", async ({ page }) => {
  await login(page);
  await page.goto("/leads");
  await page.getByRole("link", { name: "상세" }).first().click();
  await expect(page).toHaveURL(/\/leads\/.+/);

  const memo = `상담메모_${Date.now()}`;
  await page.getByPlaceholder("상담 내용/메모").fill(memo);
  await page.getByRole("button", { name: "추가" }).click();
  await expect(page.getByText(memo)).toBeVisible();
});
