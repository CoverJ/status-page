import { eq } from "drizzle-orm";
import type { Database } from "../client";
import { pages } from "../schema";
import type { NewPage, Page } from "../types";

export const PageRepository = {
	async findAll(db: Database): Promise<Page[]> {
		return db.select().from(pages);
	},

	async findById(db: Database, pageId: string): Promise<Page | undefined> {
		const results = await db
			.select()
			.from(pages)
			.where(eq(pages.pageId, pageId));
		return results[0];
	},

	async findBySubdomain(
		db: Database,
		subdomain: string,
	): Promise<Page | undefined> {
		const results = await db
			.select()
			.from(pages)
			.where(eq(pages.subdomain, subdomain));
		return results[0];
	},

	async create(db: Database, data: NewPage): Promise<Page> {
		const results = await db.insert(pages).values(data).returning();
		return results[0];
	},

	async update(
		db: Database,
		pageId: string,
		data: Partial<Omit<NewPage, "pageId">>,
	): Promise<Page | undefined> {
		const results = await db
			.update(pages)
			.set({ ...data, updatedAt: new Date().toISOString() })
			.where(eq(pages.pageId, pageId))
			.returning();
		return results[0];
	},

	async delete(db: Database, pageId: string): Promise<boolean> {
		const results = await db
			.delete(pages)
			.where(eq(pages.pageId, pageId))
			.returning();
		return results.length > 0;
	},
};
