import { asc, eq } from "drizzle-orm";
import type { Database } from "../client";
import { componentGroups } from "../schema";
import type { ComponentGroup, NewComponentGroup } from "../types";

export const ComponentGroupRepository = {
	async findAll(db: Database): Promise<ComponentGroup[]> {
		return db
			.select()
			.from(componentGroups)
			.orderBy(asc(componentGroups.position));
	},

	async findById(
		db: Database,
		groupId: string,
	): Promise<ComponentGroup | undefined> {
		const results = await db
			.select()
			.from(componentGroups)
			.where(eq(componentGroups.groupId, groupId));
		return results[0];
	},

	async findByPageId(db: Database, pageId: string): Promise<ComponentGroup[]> {
		return db
			.select()
			.from(componentGroups)
			.where(eq(componentGroups.pageId, pageId))
			.orderBy(asc(componentGroups.position));
	},

	async create(db: Database, data: NewComponentGroup): Promise<ComponentGroup> {
		const results = await db.insert(componentGroups).values(data).returning();
		return results[0];
	},

	async update(
		db: Database,
		groupId: string,
		data: Partial<Omit<NewComponentGroup, "groupId">>,
	): Promise<ComponentGroup | undefined> {
		const results = await db
			.update(componentGroups)
			.set({ ...data, updatedAt: new Date().toISOString() })
			.where(eq(componentGroups.groupId, groupId))
			.returning();
		return results[0];
	},

	async delete(db: Database, groupId: string): Promise<boolean> {
		const results = await db
			.delete(componentGroups)
			.where(eq(componentGroups.groupId, groupId))
			.returning();
		return results.length > 0;
	},
};
