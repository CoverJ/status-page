import { describe, expect, test } from "vitest";
import {
	COMPONENT_STATUSES,
	componentGroups,
	components,
	INCIDENT_IMPACTS,
	INCIDENT_STATUSES,
	incidentComponents,
	incidents,
	incidentUpdates,
	PAGE_STATUS_INDICATORS,
	pages,
} from "@/db/schema";

describe("Database Schema", () => {
	describe("pages table", () => {
		test("has correct column names", () => {
			const columns = Object.keys(pages);
			expect(columns).toContain("pageId");
			expect(columns).toContain("name");
			expect(columns).toContain("subdomain");
			expect(columns).toContain("customDomain");
			expect(columns).toContain("statusIndicator");
			expect(columns).toContain("statusDescription");
			expect(columns).toContain("createdAt");
			expect(columns).toContain("updatedAt");
		});

		test("has 8 columns", () => {
			const columns = Object.keys(pages);
			expect(columns).toHaveLength(8);
		});
	});

	describe("componentGroups table", () => {
		test("has correct column names", () => {
			const columns = Object.keys(componentGroups);
			expect(columns).toContain("groupId");
			expect(columns).toContain("pageId");
			expect(columns).toContain("name");
			expect(columns).toContain("position");
			expect(columns).toContain("createdAt");
			expect(columns).toContain("updatedAt");
		});

		test("has 6 columns", () => {
			const columns = Object.keys(componentGroups);
			expect(columns).toHaveLength(6);
		});
	});

	describe("components table", () => {
		test("has correct column names", () => {
			const columns = Object.keys(components);
			expect(columns).toContain("componentId");
			expect(columns).toContain("pageId");
			expect(columns).toContain("groupId");
			expect(columns).toContain("name");
			expect(columns).toContain("description");
			expect(columns).toContain("status");
			expect(columns).toContain("position");
			expect(columns).toContain("showcase");
			expect(columns).toContain("createdAt");
			expect(columns).toContain("updatedAt");
		});

		test("has 10 columns", () => {
			const columns = Object.keys(components);
			expect(columns).toHaveLength(10);
		});
	});

	describe("incidents table", () => {
		test("has correct column names", () => {
			const columns = Object.keys(incidents);
			expect(columns).toContain("incidentId");
			expect(columns).toContain("pageId");
			expect(columns).toContain("name");
			expect(columns).toContain("status");
			expect(columns).toContain("impact");
			expect(columns).toContain("scheduledFor");
			expect(columns).toContain("scheduledUntil");
			expect(columns).toContain("createdAt");
			expect(columns).toContain("updatedAt");
			expect(columns).toContain("resolvedAt");
		});

		test("has 10 columns", () => {
			const columns = Object.keys(incidents);
			expect(columns).toHaveLength(10);
		});
	});

	describe("incidentUpdates table", () => {
		test("has correct column names", () => {
			const columns = Object.keys(incidentUpdates);
			expect(columns).toContain("updateId");
			expect(columns).toContain("incidentId");
			expect(columns).toContain("status");
			expect(columns).toContain("body");
			expect(columns).toContain("displayAt");
			expect(columns).toContain("createdAt");
		});

		test("has 6 columns", () => {
			const columns = Object.keys(incidentUpdates);
			expect(columns).toHaveLength(6);
		});
	});

	describe("incidentComponents table", () => {
		test("has correct column names", () => {
			const columns = Object.keys(incidentComponents);
			expect(columns).toContain("incidentId");
			expect(columns).toContain("componentId");
			expect(columns).toContain("oldStatus");
			expect(columns).toContain("newStatus");
		});

		test("has 4 columns", () => {
			const columns = Object.keys(incidentComponents);
			expect(columns).toHaveLength(4);
		});
	});

	describe("status constants", () => {
		test("PAGE_STATUS_INDICATORS has expected values", () => {
			expect(PAGE_STATUS_INDICATORS).toContain("none");
			expect(PAGE_STATUS_INDICATORS).toContain("minor");
			expect(PAGE_STATUS_INDICATORS).toContain("major");
			expect(PAGE_STATUS_INDICATORS).toContain("critical");
			expect(PAGE_STATUS_INDICATORS).toContain("maintenance");
			expect(PAGE_STATUS_INDICATORS).toHaveLength(5);
		});

		test("COMPONENT_STATUSES has expected values", () => {
			expect(COMPONENT_STATUSES).toContain("operational");
			expect(COMPONENT_STATUSES).toContain("degraded_performance");
			expect(COMPONENT_STATUSES).toContain("partial_outage");
			expect(COMPONENT_STATUSES).toContain("major_outage");
			expect(COMPONENT_STATUSES).toContain("under_maintenance");
			expect(COMPONENT_STATUSES).toHaveLength(5);
		});

		test("INCIDENT_STATUSES has expected values", () => {
			expect(INCIDENT_STATUSES).toContain("investigating");
			expect(INCIDENT_STATUSES).toContain("identified");
			expect(INCIDENT_STATUSES).toContain("monitoring");
			expect(INCIDENT_STATUSES).toContain("resolved");
			expect(INCIDENT_STATUSES).toContain("scheduled");
			expect(INCIDENT_STATUSES).toContain("in_progress");
			expect(INCIDENT_STATUSES).toContain("completed");
			expect(INCIDENT_STATUSES).toHaveLength(7);
		});

		test("INCIDENT_IMPACTS has expected values", () => {
			expect(INCIDENT_IMPACTS).toContain("none");
			expect(INCIDENT_IMPACTS).toContain("minor");
			expect(INCIDENT_IMPACTS).toContain("major");
			expect(INCIDENT_IMPACTS).toContain("critical");
			expect(INCIDENT_IMPACTS).toHaveLength(4);
		});
	});
});
