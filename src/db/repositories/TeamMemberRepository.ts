import { and, eq } from "drizzle-orm";
import type { Database } from "../client";
import { teamMembers } from "../schema";
import type { NewTeamMember, TeamMember } from "../types";

export const TeamMemberRepository = {
	/**
	 * Find all team members for a page.
	 */
	async findByPageId(db: Database, pageId: string): Promise<TeamMember[]> {
		return db.select().from(teamMembers).where(eq(teamMembers.pageId, pageId));
	},

	/**
	 * Find all pages a user is a member of.
	 */
	async findByUserId(db: Database, userId: string): Promise<TeamMember[]> {
		return db.select().from(teamMembers).where(eq(teamMembers.userId, userId));
	},

	/**
	 * Find a specific team membership (user + page combination).
	 */
	async findByPageAndUser(
		db: Database,
		pageId: string,
		userId: string,
	): Promise<TeamMember | undefined> {
		const results = await db
			.select()
			.from(teamMembers)
			.where(
				and(eq(teamMembers.pageId, pageId), eq(teamMembers.userId, userId)),
			);
		return results[0];
	},

	/**
	 * Check if a user is a member of a page's team.
	 */
	async isMember(
		db: Database,
		pageId: string,
		userId: string,
	): Promise<boolean> {
		const member = await this.findByPageAndUser(db, pageId, userId);
		return !!member;
	},

	/**
	 * Check if a user has a specific role on a page's team.
	 */
	async hasRole(
		db: Database,
		pageId: string,
		userId: string,
		role: string,
	): Promise<boolean> {
		const member = await this.findByPageAndUser(db, pageId, userId);
		return member?.role === role;
	},

	async create(db: Database, data: NewTeamMember): Promise<TeamMember> {
		const results = await db.insert(teamMembers).values(data).returning();
		return results[0];
	},

	async delete(db: Database, teamMemberId: string): Promise<boolean> {
		const results = await db
			.delete(teamMembers)
			.where(eq(teamMembers.teamMemberId, teamMemberId))
			.returning();
		return results.length > 0;
	},

	/**
	 * Remove a user from a page's team.
	 */
	async removeFromPage(
		db: Database,
		pageId: string,
		userId: string,
	): Promise<boolean> {
		const results = await db
			.delete(teamMembers)
			.where(
				and(eq(teamMembers.pageId, pageId), eq(teamMembers.userId, userId)),
			)
			.returning();
		return results.length > 0;
	},
};
