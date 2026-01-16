import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { pages } from "./pages";

export const users = sqliteTable(
	"users",
	{
		userId: text("user_id").primaryKey(),
		email: text("email").notNull().unique(),
		passwordHash: text("password_hash"),
		name: text("name").notNull(),
		createdAt: text("created_at").notNull(),
		updatedAt: text("updated_at").notNull(),
		lastLoginAt: text("last_login_at"),
	},
	(table) => [index("users_email_idx").on(table.email)],
);

export const sessions = sqliteTable(
	"sessions",
	{
		sessionId: text("session_id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.userId, { onDelete: "cascade" }),
		expiresAt: text("expires_at").notNull(),
		createdAt: text("created_at").notNull(),
	},
	(table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const magicLinks = sqliteTable(
	"magic_links",
	{
		token: text("token").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.userId, { onDelete: "cascade" }),
		expiresAt: text("expires_at").notNull(),
		usedAt: text("used_at"),
		createdAt: text("created_at").notNull(),
	},
	(table) => [index("magic_links_user_id_idx").on(table.userId)],
);

export const teamMembers = sqliteTable(
	"team_members",
	{
		teamMemberId: text("team_member_id").primaryKey(),
		pageId: text("page_id")
			.notNull()
			.references(() => pages.pageId, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => users.userId, { onDelete: "cascade" }),
		role: text("role").notNull().default("member"),
		createdAt: text("created_at").notNull(),
	},
	(table) => [
		index("team_members_page_id_idx").on(table.pageId),
		index("team_members_user_id_idx").on(table.userId),
		index("team_members_page_user_idx").on(table.pageId, table.userId),
	],
);
