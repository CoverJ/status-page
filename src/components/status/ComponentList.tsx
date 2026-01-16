import type { ComponentGroup as ComponentGroupType } from "@/db/types";
import { ComponentGroup } from "./ComponentGroup";
import { ComponentItem, type ComponentWithUptime } from "./ComponentItem";

/**
 * Component group with its associated components
 */
export interface GroupWithComponents {
	group: ComponentGroupType;
	components: ComponentWithUptime[];
}

export interface ComponentListProps {
	/**
	 * Grouped components with their group metadata
	 */
	groups: GroupWithComponents[];
	/**
	 * Ungrouped components (components with no group assigned)
	 */
	ungroupedComponents: ComponentWithUptime[];
}

/**
 * Empty state component when no components are configured
 */
function EmptyState() {
	return (
		<div className="rounded-lg border border-border bg-card p-8 text-center">
			<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-6 w-6 text-muted-foreground"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={2}
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
					/>
				</svg>
			</div>
			<h3 className="mt-4 text-lg font-medium text-foreground">
				No components configured
			</h3>
			<p className="mt-2 text-sm text-muted-foreground">
				System components will appear here once they are configured.
			</p>
		</div>
	);
}

/**
 * Main component list that displays all components organized by groups
 */
export function ComponentList({
	groups,
	ungroupedComponents,
}: ComponentListProps) {
	const hasComponents =
		groups.some((g) => g.components.length > 0) ||
		ungroupedComponents.length > 0;

	if (!hasComponents) {
		return <EmptyState />;
	}

	return (
		<div className="space-y-4">
			{/* Render component groups */}
			{groups.map((groupData) => (
				<ComponentGroup
					key={groupData.group.groupId}
					name={groupData.group.name}
					components={groupData.components}
					defaultExpanded={true}
				/>
			))}

			{/* Render ungrouped components if any */}
			{ungroupedComponents.length > 0 && (
				<div className="rounded-lg border border-border bg-card overflow-hidden">
					{groups.length > 0 && (
						<div className="px-4 py-3 border-b border-border">
							<span className="font-medium text-foreground">
								Other Components
							</span>
						</div>
					)}
					<div className="divide-y divide-border">
						{ungroupedComponents.map((component) => (
							<ComponentItem
								key={component.componentId}
								component={component}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
