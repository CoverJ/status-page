import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const pages = sqliteTable(
	"pages",
	{
		pageId: text("page_id").primaryKey(),
		name: text("name").notNull(),
		subdomain: text("subdomain").notNull().unique(),
		customDomain: text("custom_domain"),
		statusIndicator: text("status_indicator").notNull().default("none"),
		statusDescription: text("status_description"),
		createdAt: text("created_at").notNull(),
		updatedAt: text("updated_at").notNull(),
	},
	(table) => [
		index("pages_subdomain_idx").on(table.subdomain),
		index("pages_custom_domain_idx").on(table.customDomain),
	],
);
