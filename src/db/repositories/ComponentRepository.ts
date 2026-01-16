import { asc, eq } from "drizzle-orm";
import type { Database } from "../client";
import { components } from "../schema";
import type { Component, NewComponent } from "../types";

export const ComponentRepository = {
	async findAll(db: Database): Promise<Component[]> {
		return db.select().from(components).orderBy(asc(components.position));
	},

	async findById(
		db: Database,
		componentId: string,
	): Promise<Component | undefined> {
		const results = await db
			.select()
			.from(components)
			.where(eq(components.componentId, componentId));
		return results[0];
	},

	async findByPageId(db: Database, pageId: string): Promise<Component[]> {
		return db
			.select()
			.from(components)
			.where(eq(components.pageId, pageId))
			.orderBy(asc(components.position));
	},

	async create(db: Database, data: NewComponent): Promise<Component> {
		const results = await db.insert(components).values(data).returning();
		return results[0];
	},

	async update(
		db: Database,
		componentId: string,
		data: Partial<Omit<NewComponent, "componentId">>,
	): Promise<Component | undefined> {
		const results = await db
			.update(components)
			.set({ ...data, updatedAt: new Date().toISOString() })
			.where(eq(components.componentId, componentId))
			.returning();
		return results[0];
	},

	async delete(db: Database, componentId: string): Promise<boolean> {
		const results = await db
			.delete(components)
			.where(eq(components.componentId, componentId))
			.returning();
		return results.length > 0;
	},

	/**
	 * Reorder components by updating their positions.
	 * @param db Database instance
	 * @param componentIds Array of component IDs in their new order
	 */
	async reorder(db: Database, componentIds: string[]): Promise<void> {
		const now = new Date().toISOString();
		await Promise.all(
			componentIds.map((componentId, index) =>
				db
					.update(components)
					.set({ position: index, updatedAt: now })
					.where(eq(components.componentId, componentId)),
			),
		);
	},
};
