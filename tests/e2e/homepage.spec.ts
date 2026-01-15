import { expect, test } from "@playwright/test";

test.describe("Homepage", () => {
	test("loads successfully", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveURL("/");
	});

	test("displays status page heading", async ({ page }) => {
		await page.goto("/");
		const heading = page.getByRole("heading", { name: "Status Page" });
		await expect(heading).toBeVisible();
	});

	test("displays shadcn button", async ({ page }) => {
		await page.goto("/");
		const button = page.getByRole("button", { name: "Get Started" });
		await expect(button).toBeVisible();
		await expect(button).toHaveAttribute("data-slot", "button");
	});
});
