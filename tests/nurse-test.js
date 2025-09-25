const { test, expect } = require("@playwright/test");

test.describe("Nurse Workflow Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test("Nurse login works", async ({ page }) => {
    await expect(page).toHaveURL("http://localhost:3000/login");
    await page.fill("input[name=\"username\"]", "nurse");
    await page.fill("input[name=\"password\"]", "nurse");
    await page.click("button[type=\"submit\"]");
    await expect(page).toHaveURL("http://localhost:3000/");
    await expect(page.locator("text=Welcome, Nurse One")).toBeVisible();
  });
});
