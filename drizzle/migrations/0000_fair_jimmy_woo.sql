CREATE TABLE `pages` (
	`page_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`subdomain` text NOT NULL,
	`custom_domain` text,
	`status_indicator` text DEFAULT 'none' NOT NULL,
	`status_description` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_subdomain_unique` ON `pages` (`subdomain`);--> statement-breakpoint
CREATE INDEX `pages_subdomain_idx` ON `pages` (`subdomain`);--> statement-breakpoint
CREATE INDEX `pages_custom_domain_idx` ON `pages` (`custom_domain`);--> statement-breakpoint
CREATE TABLE `component_groups` (
	`group_id` text PRIMARY KEY NOT NULL,
	`page_id` text NOT NULL,
	`name` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`page_id`) REFERENCES `pages`(`page_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `component_groups_page_id_idx` ON `component_groups` (`page_id`);--> statement-breakpoint
CREATE INDEX `component_groups_position_idx` ON `component_groups` (`page_id`,`position`);--> statement-breakpoint
CREATE TABLE `components` (
	`component_id` text PRIMARY KEY NOT NULL,
	`page_id` text NOT NULL,
	`group_id` text,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'operational' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`showcase` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`page_id`) REFERENCES `pages`(`page_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`group_id`) REFERENCES `component_groups`(`group_id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `components_page_id_idx` ON `components` (`page_id`);--> statement-breakpoint
CREATE INDEX `components_group_id_idx` ON `components` (`group_id`);--> statement-breakpoint
CREATE INDEX `components_position_idx` ON `components` (`page_id`,`position`);--> statement-breakpoint
CREATE INDEX `components_status_idx` ON `components` (`page_id`,`status`);--> statement-breakpoint
CREATE TABLE `incident_components` (
	`incident_id` text NOT NULL,
	`component_id` text NOT NULL,
	`old_status` text,
	`new_status` text,
	PRIMARY KEY(`incident_id`, `component_id`),
	FOREIGN KEY (`incident_id`) REFERENCES `incidents`(`incident_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`component_id`) REFERENCES `components`(`component_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `incident_components_component_id_idx` ON `incident_components` (`component_id`);--> statement-breakpoint
CREATE TABLE `incident_updates` (
	`update_id` text PRIMARY KEY NOT NULL,
	`incident_id` text NOT NULL,
	`status` text NOT NULL,
	`body` text NOT NULL,
	`display_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`incident_id`) REFERENCES `incidents`(`incident_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `incident_updates_incident_id_idx` ON `incident_updates` (`incident_id`);--> statement-breakpoint
CREATE INDEX `incident_updates_display_at_idx` ON `incident_updates` (`incident_id`,`display_at`);--> statement-breakpoint
CREATE TABLE `incidents` (
	`incident_id` text PRIMARY KEY NOT NULL,
	`page_id` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'investigating' NOT NULL,
	`impact` text DEFAULT 'none' NOT NULL,
	`scheduled_for` text,
	`scheduled_until` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`resolved_at` text,
	FOREIGN KEY (`page_id`) REFERENCES `pages`(`page_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `incidents_page_id_idx` ON `incidents` (`page_id`);--> statement-breakpoint
CREATE INDEX `incidents_status_idx` ON `incidents` (`page_id`,`status`);--> statement-breakpoint
CREATE INDEX `incidents_resolved_at_idx` ON `incidents` (`page_id`,`resolved_at`);--> statement-breakpoint
CREATE INDEX `incidents_scheduled_idx` ON `incidents` (`page_id`,`scheduled_for`);