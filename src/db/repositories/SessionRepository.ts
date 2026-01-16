import { and, eq, gt } from "drizzle-orm";
import type { Database } from "../client";
import { sessions } from "../schema";
import type { NewSession, Session } from "../types";

export const SessionRepository = {
	async findById(
		db: Database,
		sessionId: string,
	): Promise<Session | undefined> {
		const results = await db
			.select()
			.from(sessions)
			.where(eq(sessions.sessionId, sessionId));
		return results[0];
	},

	/**
	 * Find a valid (non-expired) session by ID.
	 */
	async findValid(
		db: Database,
		sessionId: string,
	): Promise<Session | undefined> {
		const now = new Date().toISOString();
		const results = await db
			.select()
			.from(sessions)
			.where(
				and(eq(sessions.sessionId, sessionId), gt(sessions.expiresAt, now)),
			);
		return results[0];
	},

	async create(db: Database, data: NewSession): Promise<Session> {
		const results = await db.insert(sessions).values(data).returning();
		return results[0];
	},

	async delete(db: Database, sessionId: string): Promise<boolean> {
		const results = await db
			.delete(sessions)
			.where(eq(sessions.sessionId, sessionId))
			.returning();
		return results.length > 0;
	},

	/**
	 * Delete all sessions for a user.
	 */
	async deleteByUserId(db: Database, userId: string): Promise<number> {
		const results = await db
			.delete(sessions)
			.where(eq(sessions.userId, userId))
			.returning();
		return results.length;
	},

	/**
	 * Update a session's expiry date (for session sliding/refresh).
	 */
	async updateExpiry(
		db: Database,
		sessionId: string,
		newExpiry: Date,
	): Promise<Session | undefined> {
		const results = await db
			.update(sessions)
			.set({ expiresAt: newExpiry.toISOString() })
			.where(eq(sessions.sessionId, sessionId))
			.returning();
		return results[0];
	},
};
