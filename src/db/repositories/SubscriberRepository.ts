import { and, eq, isNotNull, isNull } from "drizzle-orm";
import type { Database } from "../client";
import { subscribers } from "../schema";
import type { NewSubscriber, Subscriber } from "../types";

export const SubscriberRepository = {
	async findAll(db: Database): Promise<Subscriber[]> {
		return db.select().from(subscribers);
	},

	async findById(
		db: Database,
		subscriberId: string,
	): Promise<Subscriber | undefined> {
		const results = await db
			.select()
			.from(subscribers)
			.where(eq(subscribers.subscriberId, subscriberId));
		return results[0];
	},

	async findByPageId(db: Database, pageId: string): Promise<Subscriber[]> {
		return db.select().from(subscribers).where(eq(subscribers.pageId, pageId));
	},

	/**
	 * Find confirmed subscribers for a page (confirmedAt is not null and unsubscribedAt is null).
	 */
	async findConfirmed(db: Database, pageId: string): Promise<Subscriber[]> {
		return db
			.select()
			.from(subscribers)
			.where(
				and(
					eq(subscribers.pageId, pageId),
					isNotNull(subscribers.confirmedAt),
					isNull(subscribers.unsubscribedAt),
				),
			);
	},

	async create(db: Database, data: NewSubscriber): Promise<Subscriber> {
		const results = await db.insert(subscribers).values(data).returning();
		return results[0];
	},

	async update(
		db: Database,
		subscriberId: string,
		data: Partial<Omit<NewSubscriber, "subscriberId">>,
	): Promise<Subscriber | undefined> {
		const results = await db
			.update(subscribers)
			.set(data)
			.where(eq(subscribers.subscriberId, subscriberId))
			.returning();
		return results[0];
	},

	async delete(db: Database, subscriberId: string): Promise<boolean> {
		const results = await db
			.delete(subscribers)
			.where(eq(subscribers.subscriberId, subscriberId))
			.returning();
		return results.length > 0;
	},
};
