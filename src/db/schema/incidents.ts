import { index, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { components } from "./components";
import { pages } from "./pages";

export const incidents = sqliteTable(
	"incidents",
	{
		incidentId: text("incident_id").primaryKey(),
		pageId: text("page_id")
			.notNull()
			.references(() => pages.pageId, { onDelete: "cascade" }),
		name: text("name").notNull(),
		status: text("status").notNull().default("investigating"),
		impact: text("impact").notNull().default("none"),
		scheduledFor: text("scheduled_for"),
		scheduledUntil: text("scheduled_until"),
		createdAt: text("created_at").notNull(),
		updatedAt: text("updated_at").notNull(),
		resolvedAt: text("resolved_at"),
	},
	(table) => [
		index("incidents_page_id_idx").on(table.pageId),
		index("incidents_status_idx").on(table.pageId, table.status),
		index("incidents_resolved_at_idx").on(table.pageId, table.resolvedAt),
		index("incidents_scheduled_idx").on(table.pageId, table.scheduledFor),
	],
);

export const incidentUpdates = sqliteTable(
	"incident_updates",
	{
		updateId: text("update_id").primaryKey(),
		incidentId: text("incident_id")
			.notNull()
			.references(() => incidents.incidentId, { onDelete: "cascade" }),
		status: text("status").notNull(),
		body: text("body").notNull(),
		displayAt: text("display_at").notNull(),
		createdAt: text("created_at").notNull(),
	},
	(table) => [
		index("incident_updates_incident_id_idx").on(table.incidentId),
		index("incident_updates_display_at_idx").on(
			table.incidentId,
			table.displayAt,
		),
	],
);

export const incidentComponents = sqliteTable(
	"incident_components",
	{
		incidentId: text("incident_id")
			.notNull()
			.references(() => incidents.incidentId, { onDelete: "cascade" }),
		componentId: text("component_id")
			.notNull()
			.references(() => components.componentId, { onDelete: "cascade" }),
		oldStatus: text("old_status"),
		newStatus: text("new_status"),
	},
	(table) => [
		primaryKey({ columns: [table.incidentId, table.componentId] }),
		index("incident_components_component_id_idx").on(table.componentId),
	],
);
