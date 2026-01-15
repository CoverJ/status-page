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

	test("heading has Tailwind styling", async ({ page }) => {
		await page.goto("/");
		const heading = page.getByRole("heading", { name: "Status Page" });
		await expect(heading).toHaveClass(/text-4xl/);
		await expect(heading).toHaveClass(/font-bold/);
		await expect(heading).toHaveClass(/text-blue-600/);
	});
});
