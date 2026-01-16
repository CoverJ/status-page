import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { pages } from "./pages";

export const subscribers = sqliteTable(
	"subscribers",
	{
		subscriberId: text("subscriber_id").primaryKey(),
		pageId: text("page_id")
			.notNull()
			.references(() => pages.pageId, { onDelete: "cascade" }),
		email: text("email").notNull(),
		componentIds: text("component_ids"),
		confirmedAt: text("confirmed_at"),
		quarantinedAt: text("quarantined_at"),
		unsubscribedAt: text("unsubscribed_at"),
		createdAt: text("created_at").notNull(),
	},
	(table) => [
		index("subscribers_page_id_idx").on(table.pageId),
		index("subscribers_email_idx").on(table.email),
		index("subscribers_page_email_idx").on(table.pageId, table.email),
	],
);

export const subscriberConfirmations = sqliteTable(
	"subscriber_confirmations",
	{
		token: text("token").primaryKey(),
		subscriberId: text("subscriber_id")
			.notNull()
			.references(() => subscribers.subscriberId, { onDelete: "cascade" }),
		expiresAt: text("expires_at").notNull(),
		createdAt: text("created_at").notNull(),
	},
	(table) => [
		index("subscriber_confirmations_subscriber_id_idx").on(table.subscriberId),
	],
);
