import { expect, test } from "@playwright/test";

test.describe("Homepage", () => {
	test("loads successfully", async ({ page }) => {
		await page.goto("/");

		// Page should load without errors
		await expect(page).toHaveURL("/");
	});

	test("contains Astro documentation link", async ({ page }) => {
		await page.goto("/");

		// Check for the docs link (use the one with "Read our docs" text in hero section)
		const docsLink = page.getByRole("link", { name: "Read our docs" });
		await expect(docsLink).toBeVisible();
	});

	test("contains hero section with getting started message", async ({
		page,
	}) => {
		await page.goto("/");

		// Check for the hero content
		const heroSection = page.locator("#hero");
		await expect(heroSection).toBeVisible();

		// Check for the code block with src/pages reference
		const codeBlock = page.locator("code pre");
		await expect(codeBlock).toContainText("src/pages");
	});

	test("has working navigation links", async ({ page }) => {
		await page.goto("/");

		// Check that main links exist and are clickable
		const discordLink = page.getByRole("link", { name: "Join our Discord" });
		await expect(discordLink).toBeVisible();

		// Check the news box link
		const newsLink = page.locator("#news");
		await expect(newsLink).toHaveAttribute(
			"href",
			"https://astro.build/blog/astro-5/",
		);
	});

	test("is responsive on mobile viewport", async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");

		// Hero section should still be visible
		const heroSection = page.locator("#hero");
		await expect(heroSection).toBeVisible();

		// Docs button should still be accessible
		const docsLink = page.getByRole("link", { name: "Read our docs" });
		await expect(docsLink).toBeVisible();
	});
});
