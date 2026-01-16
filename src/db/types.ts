import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type {
	componentGroups,
	components,
	incidentComponents,
	incidents,
	incidentUpdates,
	pages,
} from "./schema";

// Select types (for reading from DB)
export type Page = InferSelectModel<typeof pages>;
export type Component = InferSelectModel<typeof components>;
export type ComponentGroup = InferSelectModel<typeof componentGroups>;
export type Incident = InferSelectModel<typeof incidents>;
export type IncidentUpdate = InferSelectModel<typeof incidentUpdates>;
export type IncidentComponent = InferSelectModel<typeof incidentComponents>;

// Insert types (for creating records)
export type NewPage = InferInsertModel<typeof pages>;
export type NewComponent = InferInsertModel<typeof components>;
export type NewComponentGroup = InferInsertModel<typeof componentGroups>;
export type NewIncident = InferInsertModel<typeof incidents>;
export type NewIncidentUpdate = InferInsertModel<typeof incidentUpdates>;
export type NewIncidentComponent = InferInsertModel<typeof incidentComponents>;

// Re-export status types
export type {
	ComponentStatus,
	IncidentImpact,
	IncidentStatus,
	PageStatusIndicator,
} from "./schema/constants";
