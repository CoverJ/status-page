import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";
import StatusBadge from "../../src/components/StatusBadge.astro";

describe("StatusBadge component", () => {
	test("renders operational status with default text", async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(StatusBadge, {
			props: { status: "operational" },
		});

		expect(result).toContain("Operational");
		expect(result).toContain('data-status="operational"');
		expect(result).toContain("status-operational");
	});

	test("renders major outage status", async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(StatusBadge, {
			props: { status: "major" },
		});

		expect(result).toContain("Major Outage");
		expect(result).toContain('data-status="major"');
		expect(result).toContain("status-major");
	});

	test("renders custom label when provided", async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(StatusBadge, {
			props: { status: "maintenance", label: "Scheduled Maintenance" },
		});

		expect(result).toContain("Scheduled Maintenance");
		expect(result).not.toContain("Under Maintenance");
	});

	test("renders all status types correctly", async () => {
		const container = await AstroContainer.create();
		const statuses = [
			"operational",
			"degraded",
			"partial",
			"major",
			"maintenance",
		] as const;

		for (const status of statuses) {
			const result = await container.renderToString(StatusBadge, {
				props: { status },
			});

			expect(result).toContain(`data-status="${status}"`);
			expect(result).toContain(`status-${status}`);
		}
	});
});
