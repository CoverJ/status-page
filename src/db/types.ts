import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type {
	componentGroups,
	components,
	incidentComponents,
	incidents,
	incidentUpdates,
	magicLinks,
	pages,
	sessions,
	subscriberConfirmations,
	subscribers,
	teamMembers,
	users,
} from "./schema";

// Select types (for reading from DB)
export type Page = InferSelectModel<typeof pages>;
export type Component = InferSelectModel<typeof components>;
export type ComponentGroup = InferSelectModel<typeof componentGroups>;
export type Incident = InferSelectModel<typeof incidents>;
export type IncidentUpdate = InferSelectModel<typeof incidentUpdates>;
export type IncidentComponent = InferSelectModel<typeof incidentComponents>;
export type User = InferSelectModel<typeof users>;
export type Session = InferSelectModel<typeof sessions>;
export type MagicLink = InferSelectModel<typeof magicLinks>;
export type TeamMember = InferSelectModel<typeof teamMembers>;
export type Subscriber = InferSelectModel<typeof subscribers>;
export type SubscriberConfirmation = InferSelectModel<
	typeof subscriberConfirmations
>;

// Insert types (for creating records)
export type NewPage = InferInsertModel<typeof pages>;
export type NewComponent = InferInsertModel<typeof components>;
export type NewComponentGroup = InferInsertModel<typeof componentGroups>;
export type NewIncident = InferInsertModel<typeof incidents>;
export type NewIncidentUpdate = InferInsertModel<typeof incidentUpdates>;
export type NewIncidentComponent = InferInsertModel<typeof incidentComponents>;
export type NewUser = InferInsertModel<typeof users>;
export type NewSession = InferInsertModel<typeof sessions>;
export type NewMagicLink = InferInsertModel<typeof magicLinks>;
export type NewTeamMember = InferInsertModel<typeof teamMembers>;
export type NewSubscriber = InferInsertModel<typeof subscribers>;
export type NewSubscriberConfirmation = InferInsertModel<
	typeof subscriberConfirmations
>;

// Re-export status types
export type {
	ComponentStatus,
	IncidentImpact,
	IncidentStatus,
	PageStatusIndicator,
} from "./schema/constants";
