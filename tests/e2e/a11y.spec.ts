import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { login } from "./helpers";

// 심각도 serious/critical 위반만 실패로 간주(점진적 개선 여지)
async function scan(page: any) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  return results.violations.filter((v: any) => ["serious", "critical"].includes(v.impact));
}

test("로그인 페이지 a11y(심각/치명 위반 없음)", async ({ page }) => {
  await page.goto("/login");
  const v = await scan(page);
  expect(v, JSON.stringify(v.map((x: any) => x.id), null, 2)).toEqual([]);
});

test("공개 신청폼 a11y", async ({ page }) => {
  await page.goto("/apply");
  const v = await scan(page);
  expect(v, JSON.stringify(v.map((x: any) => x.id), null, 2)).toEqual([]);
});

test("대시보드 a11y(로그인 후)", async ({ page }) => {
  await login(page);
  const v = await scan(page);
  expect(v, JSON.stringify(v.map((x: any) => x.id), null, 2)).toEqual([]);
});

test("리드 파이프라인 a11y", async ({ page }) => {
  await login(page);
  await page.goto("/leads");
  const v = await scan(page);
  expect(v, JSON.stringify(v.map((x: any) => x.id), null, 2)).toEqual([]);
});
