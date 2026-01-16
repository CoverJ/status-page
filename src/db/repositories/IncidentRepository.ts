import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import type { Database } from "../client";
import { incidents } from "../schema";
import type { Incident, NewIncident } from "../types";

export const IncidentRepository = {
	async findAll(db: Database): Promise<Incident[]> {
		return db.select().from(incidents).orderBy(desc(incidents.createdAt));
	},

	async findById(
		db: Database,
		incidentId: string,
	): Promise<Incident | undefined> {
		const results = await db
			.select()
			.from(incidents)
			.where(eq(incidents.incidentId, incidentId));
		return results[0];
	},

	async findByPageId(db: Database, pageId: string): Promise<Incident[]> {
		return db
			.select()
			.from(incidents)
			.where(eq(incidents.pageId, pageId))
			.orderBy(desc(incidents.createdAt));
	},

	/**
	 * Find all unresolved incidents for a page (resolvedAt is null).
	 */
	async findUnresolved(db: Database, pageId: string): Promise<Incident[]> {
		return db
			.select()
			.from(incidents)
			.where(and(eq(incidents.pageId, pageId), isNull(incidents.resolvedAt)))
			.orderBy(desc(incidents.createdAt));
	},

	/**
	 * Find all scheduled incidents for a page (scheduledFor is not null).
	 */
	async findScheduled(db: Database, pageId: string): Promise<Incident[]> {
		return db
			.select()
			.from(incidents)
			.where(
				and(eq(incidents.pageId, pageId), isNotNull(incidents.scheduledFor)),
			)
			.orderBy(desc(incidents.scheduledFor));
	},

	async create(db: Database, data: NewIncident): Promise<Incident> {
		const results = await db.insert(incidents).values(data).returning();
		return results[0];
	},

	async update(
		db: Database,
		incidentId: string,
		data: Partial<Omit<NewIncident, "incidentId">>,
	): Promise<Incident | undefined> {
		const results = await db
			.update(incidents)
			.set({ ...data, updatedAt: new Date().toISOString() })
			.where(eq(incidents.incidentId, incidentId))
			.returning();
		return results[0];
	},

	async delete(db: Database, incidentId: string): Promise<boolean> {
		const results = await db
			.delete(incidents)
			.where(eq(incidents.incidentId, incidentId))
			.returning();
		return results.length > 0;
	},
};
