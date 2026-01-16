import { useState } from "react";
import type { ComponentStatus } from "@/db/schema/constants";
import { cn } from "@/lib/utils";
import { ComponentItem, type ComponentWithUptime } from "./ComponentItem";

export interface ComponentGroupProps {
	/**
	 * The name of the component group
	 */
	name: string;
	/**
	 * Components belonging to this group
	 */
	components: ComponentWithUptime[];
	/**
	 * Whether the group should be expanded by default
	 */
	defaultExpanded?: boolean;
}

/**
 * Gets the worst status in a list of components for the group indicator
 */
function getGroupStatus(components: ComponentWithUptime[]): ComponentStatus {
	const statusPriority: ComponentStatus[] = [
		"major_outage",
		"partial_outage",
		"degraded_performance",
		"under_maintenance",
		"operational",
	];

	for (const status of statusPriority) {
		if (components.some((c) => c.status === status)) {
			return status;
		}
	}
	return "operational";
}

/**
 * Gets the status dot color class for a component status
 */
function getStatusDotClass(status: ComponentStatus): string {
	const statusColors: Record<ComponentStatus, string> = {
		operational: "bg-emerald-500",
		degraded_performance: "bg-yellow-500",
		partial_outage: "bg-orange-500",
		major_outage: "bg-red-500",
		under_maintenance: "bg-blue-500",
	};
	return statusColors[status];
}

/**
 * Collapsible component group with status indicator
 */
export function ComponentGroup({
	name,
	components,
	defaultExpanded = true,
}: ComponentGroupProps) {
	const [isExpanded, setIsExpanded] = useState(defaultExpanded);
	const groupStatus = getGroupStatus(components);

	return (
		<div className="rounded-lg border border-border bg-card overflow-hidden">
			{/* Group Header - Clickable to toggle */}
			<button
				type="button"
				onClick={() => setIsExpanded(!isExpanded)}
				className={cn(
					"w-full flex items-center justify-between px-4 py-3",
					"hover:bg-muted/50 transition-colors",
					"focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
				)}
				aria-expanded={isExpanded}
				aria-controls={`group-${name.replace(/\s+/g, "-").toLowerCase()}`}
			>
				<div className="flex items-center gap-3">
					{/* Group status indicator */}
					<span
						className={cn(
							"h-2.5 w-2.5 rounded-full shrink-0",
							getStatusDotClass(groupStatus),
						)}
						aria-hidden="true"
					/>
					<span className="font-medium text-foreground">{name}</span>
					<span className="text-sm text-muted-foreground">
						({components.length} component{components.length !== 1 ? "s" : ""})
					</span>
				</div>

				{/* Chevron icon */}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className={cn(
						"h-5 w-5 text-muted-foreground transition-transform duration-200",
						isExpanded && "rotate-180",
					)}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={2}
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>

			{/* Components list */}
			<div
				id={`group-${name.replace(/\s+/g, "-").toLowerCase()}`}
				className={cn(
					"transition-all duration-200 ease-in-out",
					isExpanded
						? "max-h-[2000px] opacity-100"
						: "max-h-0 opacity-0 overflow-hidden",
				)}
			>
				<div className="border-t border-border divide-y divide-border">
					{components.map((component) => (
						<ComponentItem key={component.componentId} component={component} />
					))}
				</div>
			</div>
		</div>
	);
}
