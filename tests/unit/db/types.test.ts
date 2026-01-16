import { describe, expect, test } from "vitest";
import type {
	Component,
	ComponentGroup,
	Incident,
	IncidentComponent,
	IncidentUpdate,
	NewComponent,
	NewComponentGroup,
	NewIncident,
	NewIncidentComponent,
	NewIncidentUpdate,
	NewPage,
	Page,
} from "@/db/types";

describe("Database Types", () => {
	describe("Page types", () => {
		test("Page type has required fields", () => {
			const page: Page = {
				pageId: "test-id",
				name: "Test Page",
				subdomain: "test",
				customDomain: null,
				statusIndicator: "none",
				statusDescription: null,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};
			expect(page.pageId).toBe("test-id");
			expect(page.subdomain).toBe("test");
		});

		test("NewPage type allows omitting optional fields", () => {
			const newPage: NewPage = {
				pageId: "test-id",
				name: "Test Page",
				subdomain: "test",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};
			expect(newPage.customDomain).toBeUndefined();
			expect(newPage.statusDescription).toBeUndefined();
		});
	});

	describe("Component types", () => {
		test("Component type has required fields", () => {
			const component: Component = {
				componentId: "comp-1",
				pageId: "page-1",
				groupId: null,
				name: "API Server",
				description: null,
				status: "operational",
				position: 0,
				showcase: true,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};
			expect(component.componentId).toBe("comp-1");
			expect(component.showcase).toBe(true);
		});

		test("NewComponent type allows omitting optional fields", () => {
			const newComponent: NewComponent = {
				componentId: "comp-1",
				pageId: "page-1",
				name: "API Server",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};
			expect(newComponent.groupId).toBeUndefined();
			expect(newComponent.description).toBeUndefined();
		});
	});

	describe("ComponentGroup types", () => {
		test("ComponentGroup type has required fields", () => {
			const group: ComponentGroup = {
				groupId: "group-1",
				pageId: "page-1",
				name: "Infrastructure",
				position: 0,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};
			expect(group.groupId).toBe("group-1");
			expect(group.position).toBe(0);
		});

		test("NewComponentGroup type allows using defaults", () => {
			const newGroup: NewComponentGroup = {
				groupId: "group-1",
				pageId: "page-1",
				name: "Infrastructure",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};
			expect(newGroup.position).toBeUndefined();
		});
	});

	describe("Incident types", () => {
		test("Incident type has required fields", () => {
			const incident: Incident = {
				incidentId: "inc-1",
				pageId: "page-1",
				name: "API Outage",
				status: "investigating",
				impact: "major",
				scheduledFor: null,
				scheduledUntil: null,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
				resolvedAt: null,
			};
			expect(incident.incidentId).toBe("inc-1");
			expect(incident.impact).toBe("major");
		});

		test("NewIncident type allows omitting optional fields", () => {
			const newIncident: NewIncident = {
				incidentId: "inc-1",
				pageId: "page-1",
				name: "API Outage",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};
			expect(newIncident.scheduledFor).toBeUndefined();
			expect(newIncident.resolvedAt).toBeUndefined();
		});
	});

	describe("IncidentUpdate types", () => {
		test("IncidentUpdate type has required fields", () => {
			const update: IncidentUpdate = {
				updateId: "upd-1",
				incidentId: "inc-1",
				status: "investigating",
				body: "We are investigating the issue.",
				displayAt: "2024-01-01T00:00:00Z",
				createdAt: "2024-01-01T00:00:00Z",
			};
			expect(update.updateId).toBe("upd-1");
			expect(update.body).toBe("We are investigating the issue.");
		});

		test("NewIncidentUpdate type requires all fields", () => {
			const newUpdate: NewIncidentUpdate = {
				updateId: "upd-1",
				incidentId: "inc-1",
				status: "investigating",
				body: "We are investigating the issue.",
				displayAt: "2024-01-01T00:00:00Z",
				createdAt: "2024-01-01T00:00:00Z",
			};
			expect(newUpdate.updateId).toBe("upd-1");
		});
	});

	describe("IncidentComponent types", () => {
		test("IncidentComponent type has required fields", () => {
			const incComp: IncidentComponent = {
				incidentId: "inc-1",
				componentId: "comp-1",
				oldStatus: "operational",
				newStatus: "major_outage",
			};
			expect(incComp.incidentId).toBe("inc-1");
			expect(incComp.oldStatus).toBe("operational");
		});

		test("NewIncidentComponent type allows null status", () => {
			const newIncComp: NewIncidentComponent = {
				incidentId: "inc-1",
				componentId: "comp-1",
			};
			expect(newIncComp.oldStatus).toBeUndefined();
			expect(newIncComp.newStatus).toBeUndefined();
		});
	});
});
