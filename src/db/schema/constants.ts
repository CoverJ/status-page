/**
 * Status constants for the status page application.
 * Stored as text in SQLite/D1 (no native enum support).
 */

export const PAGE_STATUS_INDICATORS = [
	"none",
	"minor",
	"major",
	"critical",
	"maintenance",
] as const;

export const COMPONENT_STATUSES = [
	"operational",
	"degraded_performance",
	"partial_outage",
	"major_outage",
	"under_maintenance",
] as const;

export const INCIDENT_STATUSES = [
	"investigating",
	"identified",
	"monitoring",
	"resolved",
	"scheduled",
	"in_progress",
	"completed",
] as const;

export const INCIDENT_IMPACTS = ["none", "minor", "major", "critical"] as const;

export const TEAM_MEMBER_ROLES = ["owner", "admin", "member"] as const;

export type PageStatusIndicator = (typeof PAGE_STATUS_INDICATORS)[number];
export type ComponentStatus = (typeof COMPONENT_STATUSES)[number];
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];
export type IncidentImpact = (typeof INCIDENT_IMPACTS)[number];
export type TeamMemberRole = (typeof TEAM_MEMBER_ROLES)[number];
