import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { pages } from "./pages";

export const componentGroups = sqliteTable(
	"component_groups",
	{
		groupId: text("group_id").primaryKey(),
		pageId: text("page_id")
			.notNull()
			.references(() => pages.pageId, { onDelete: "cascade" }),
		name: text("name").notNull(),
		position: integer("position").notNull().default(0),
		createdAt: text("created_at").notNull(),
		updatedAt: text("updated_at").notNull(),
	},
	(table) => [
		index("component_groups_page_id_idx").on(table.pageId),
		index("component_groups_position_idx").on(table.pageId, table.position),
	],
);

export const components = sqliteTable(
	"components",
	{
		componentId: text("component_id").primaryKey(),
		pageId: text("page_id")
			.notNull()
			.references(() => pages.pageId, { onDelete: "cascade" }),
		groupId: text("group_id").references(() => componentGroups.groupId, {
			onDelete: "set null",
		}),
		name: text("name").notNull(),
		description: text("description"),
		status: text("status").notNull().default("operational"),
		position: integer("position").notNull().default(0),
		showcase: integer("showcase", { mode: "boolean" }).notNull().default(true),
		createdAt: text("created_at").notNull(),
		updatedAt: text("updated_at").notNull(),
	},
	(table) => [
		index("components_page_id_idx").on(table.pageId),
		index("components_group_id_idx").on(table.groupId),
		index("components_position_idx").on(table.pageId, table.position),
		index("components_status_idx").on(table.pageId, table.status),
	],
);
