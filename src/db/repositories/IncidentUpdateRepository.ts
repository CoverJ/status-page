import { desc, eq } from "drizzle-orm";
import type { Database } from "../client";
import { incidentUpdates } from "../schema";
import type { IncidentUpdate, NewIncidentUpdate } from "../types";

export const IncidentUpdateRepository = {
	async findById(
		db: Database,
		updateId: string,
	): Promise<IncidentUpdate | undefined> {
		const results = await db
			.select()
			.from(incidentUpdates)
			.where(eq(incidentUpdates.updateId, updateId));
		return results[0];
	},

	async findByIncidentId(
		db: Database,
		incidentId: string,
	): Promise<IncidentUpdate[]> {
		return db
			.select()
			.from(incidentUpdates)
			.where(eq(incidentUpdates.incidentId, incidentId))
			.orderBy(desc(incidentUpdates.displayAt));
	},

	async create(
		db: Database,
		data: NewIncidentUpdate,
	): Promise<IncidentUpdate> {
		const results = await db.insert(incidentUpdates).values(data).returning();
		return results[0];
	},
};
