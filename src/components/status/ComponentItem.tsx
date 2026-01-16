import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Component } from "@/db/types";
import type { ComponentStatus } from "@/db/schema/constants";

/**
 * Component with optional uptime percentage for showcased components
 */
export interface ComponentWithUptime extends Component {
	/**
	 * Uptime percentage for the last 90 days (0-100)
	 * Only calculated for showcased components
	 */
	uptimePercentage?: number;
}

/**
 * Status display configuration
 */
interface StatusConfig {
	label: string;
	dotClass: string;
	textClass: string;
}

/**
 * Maps component status to display configuration
 */
const STATUS_CONFIG: Record<ComponentStatus, StatusConfig> = {
	operational: {
		label: "Operational",
		dotClass: "bg-emerald-500",
		textClass: "text-emerald-600 dark:text-emerald-400",
	},
	degraded_performance: {
		label: "Degraded Performance",
		dotClass: "bg-yellow-500",
		textClass: "text-yellow-600 dark:text-yellow-400",
	},
	partial_outage: {
		label: "Partial Outage",
		dotClass: "bg-orange-500",
		textClass: "text-orange-600 dark:text-orange-400",
	},
	major_outage: {
		label: "Major Outage",
		dotClass: "bg-red-500",
		textClass: "text-red-600 dark:text-red-400",
	},
	under_maintenance: {
		label: "Under Maintenance",
		dotClass: "bg-blue-500",
		textClass: "text-blue-600 dark:text-blue-400",
	},
};

export interface ComponentItemProps {
	component: ComponentWithUptime;
}

/**
 * Individual component status display with description tooltip/expandable
 */
export function ComponentItem({ component }: ComponentItemProps) {
	const [showDescription, setShowDescription] = useState(false);
	const status = (component.status as ComponentStatus) || "operational";
	const config = STATUS_CONFIG[status];

	const hasDescription = Boolean(component.description);
	const showUptime = component.showcase && component.uptimePercentage !== undefined;

	return (
		<div className="group">
			<div
				className={cn(
					"flex items-center justify-between px-4 py-3",
					hasDescription && "cursor-pointer hover:bg-muted/30 transition-colors"
				)}
				onClick={() => hasDescription && setShowDescription(!showDescription)}
				onKeyDown={(e) => {
					if (hasDescription && (e.key === "Enter" || e.key === " ")) {
						e.preventDefault();
						setShowDescription(!showDescription);
					}
				}}
				role={hasDescription ? "button" : undefined}
				tabIndex={hasDescription ? 0 : undefined}
				aria-expanded={hasDescription ? showDescription : undefined}
			>
				{/* Component name and info icon */}
				<div className="flex items-center gap-2">
					<span className="text-foreground">{component.name}</span>
					{hasDescription && (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className={cn(
								"h-4 w-4 text-muted-foreground transition-opacity",
								"opacity-0 group-hover:opacity-100"
							)}
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					)}
				</div>

				{/* Status and uptime */}
				<div className="flex items-center gap-4">
					{/* Uptime percentage for showcased components */}
					{showUptime && (
						<span className="text-sm text-muted-foreground">
							{component.uptimePercentage?.toFixed(2)}% uptime
						</span>
					)}

					{/* Status indicator */}
					<div className="flex items-center gap-2">
						<span
							className={cn("h-2.5 w-2.5 rounded-full shrink-0", config.dotClass)}
							aria-hidden="true"
						/>
						<span className={cn("text-sm font-medium", config.textClass)}>
							{config.label}
						</span>
					</div>
				</div>
			</div>

			{/* Expandable description */}
			{hasDescription && (
				<div
					className={cn(
						"overflow-hidden transition-all duration-200 ease-in-out",
						showDescription ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
					)}
				>
					<div className="px-4 pb-3 pt-0">
						<p className="text-sm text-muted-foreground bg-muted/30 rounded-md p-3">
							{component.description}
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
