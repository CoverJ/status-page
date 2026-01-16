import {
	ChevronDown,
	FolderOpen,
	MoreHorizontal,
	Pencil,
	Plus,
	Server,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ComponentStatus } from "@/db/schema/constants";
import { cn } from "@/lib/utils";

/**
 * Component status configuration with display names and colors
 */
const STATUS_CONFIG: Record<
	ComponentStatus,
	{ label: string; color: string; bgColor: string }
> = {
	operational: {
		label: "Operational",
		color: "bg-green-500",
		bgColor: "bg-green-500/10 text-green-700 dark:text-green-400",
	},
	degraded_performance: {
		label: "Degraded Performance",
		color: "bg-yellow-500",
		bgColor: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
	},
	partial_outage: {
		label: "Partial Outage",
		color: "bg-orange-500",
		bgColor: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
	},
	major_outage: {
		label: "Major Outage",
		color: "bg-red-500",
		bgColor: "bg-red-500/10 text-red-700 dark:text-red-400",
	},
	under_maintenance: {
		label: "Under Maintenance",
		color: "bg-blue-500",
		bgColor: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
	},
};

const ALL_STATUSES: ComponentStatus[] = [
	"operational",
	"degraded_performance",
	"partial_outage",
	"major_outage",
	"under_maintenance",
];

export interface ComponentData {
	componentId: string;
	name: string;
	description: string | null;
	status: ComponentStatus;
	groupId: string | null;
	position: number;
}

export interface ComponentGroupData {
	groupId: string;
	name: string;
	position: number;
}

export interface ComponentListProps {
	/**
	 * List of components to display
	 */
	components: ComponentData[];
	/**
	 * List of component groups
	 */
	groups: ComponentGroupData[];
	/**
	 * Callback when a component's status is changed
	 */
	onStatusChange?: (componentId: string, newStatus: ComponentStatus) => void;
	/**
	 * Callback when Add Component button is clicked
	 */
	onAddComponent?: () => void;
	/**
	 * Callback when Add Group button is clicked
	 */
	onAddGroup?: () => void;
	/**
	 * Callback when Edit is clicked on a component
	 */
	onEditComponent?: (component: ComponentData) => void;
	/**
	 * Callback when Delete is clicked on a component
	 */
	onDeleteComponent?: (component: ComponentData) => void;
	/**
	 * Whether status changes are currently being processed
	 */
	isUpdating?: boolean;
}

/**
 * Status indicator dot component
 */
function StatusIndicator({ status }: { status: ComponentStatus }) {
	const config = STATUS_CONFIG[status];
	return (
		<span
			role="img"
			className={cn("inline-block h-2.5 w-2.5 rounded-full", config.color)}
			aria-label={config.label}
		/>
	);
}

/**
 * Status dropdown for quick status changes
 */
function StatusDropdown({
	componentId,
	currentStatus,
	onStatusChange,
	disabled,
}: {
	componentId: string;
	currentStatus: ComponentStatus;
	onStatusChange?: (componentId: string, newStatus: ComponentStatus) => void;
	disabled?: boolean;
}) {
	const config = STATUS_CONFIG[currentStatus];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className={cn("h-7 gap-1.5 px-2 text-xs font-medium", config.bgColor)}
					disabled={disabled}
				>
					<StatusIndicator status={currentStatus} />
					{config.label}
					<ChevronDown className="h-3 w-3 opacity-50" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				{ALL_STATUSES.map((status) => {
					const statusConfig = STATUS_CONFIG[status];
					const isSelected = status === currentStatus;
					return (
						<DropdownMenuItem
							key={status}
							onClick={() => onStatusChange?.(componentId, status)}
							className={cn("cursor-pointer gap-2", isSelected && "bg-accent")}
						>
							<StatusIndicator status={status} />
							<span>{statusConfig.label}</span>
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/**
 * Actions dropdown for edit/delete
 */
function ComponentActions({
	component,
	onEdit,
	onDelete,
	disabled,
}: {
	component: ComponentData;
	onEdit?: (component: ComponentData) => void;
	onDelete?: (component: ComponentData) => void;
	disabled?: boolean;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="h-8 w-8 p-0"
					disabled={disabled}
				>
					<span className="sr-only">Open menu</span>
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem
					onClick={() => onEdit?.(component)}
					className="cursor-pointer"
				>
					<Pencil className="h-4 w-4" />
					Edit
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={() => onDelete?.(component)}
					className="cursor-pointer text-destructive focus:text-destructive"
				>
					<Trash2 className="h-4 w-4" />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/**
 * Single component row
 */
function ComponentRow({
	component,
	onStatusChange,
	onEdit,
	onDelete,
	isUpdating,
}: {
	component: ComponentData;
	onStatusChange?: (componentId: string, newStatus: ComponentStatus) => void;
	onEdit?: (component: ComponentData) => void;
	onDelete?: (component: ComponentData) => void;
	isUpdating?: boolean;
}) {
	return (
		<div className="flex items-center justify-between py-3 px-4 hover:bg-muted/50 transition-colors">
			<div className="flex items-center gap-3 min-w-0">
				<Server className="h-4 w-4 text-muted-foreground shrink-0" />
				<div className="min-w-0">
					<p className="font-medium text-sm truncate">{component.name}</p>
					{component.description && (
						<p className="text-xs text-muted-foreground truncate">
							{component.description}
						</p>
					)}
				</div>
			</div>
			<div className="flex items-center gap-2">
				<StatusDropdown
					componentId={component.componentId}
					currentStatus={component.status}
					onStatusChange={onStatusChange}
					disabled={isUpdating}
				/>
				<ComponentActions
					component={component}
					onEdit={onEdit}
					onDelete={onDelete}
					disabled={isUpdating}
				/>
			</div>
		</div>
	);
}

/**
 * Component group section
 */
function ComponentGroupSection({
	group,
	components,
	onStatusChange,
	onEditComponent,
	onDeleteComponent,
	isUpdating,
}: {
	group: ComponentGroupData;
	components: ComponentData[];
	onStatusChange?: (componentId: string, newStatus: ComponentStatus) => void;
	onEditComponent?: (component: ComponentData) => void;
	onDeleteComponent?: (component: ComponentData) => void;
	isUpdating?: boolean;
}) {
	const [isExpanded, setIsExpanded] = useState(true);

	return (
		<div className="border rounded-lg overflow-hidden">
			<button
				type="button"
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
			>
				<div className="flex items-center gap-2">
					<FolderOpen className="h-4 w-4 text-muted-foreground" />
					<span className="font-medium text-sm">{group.name}</span>
					<span className="text-xs text-muted-foreground">
						({components.length} component{components.length !== 1 ? "s" : ""})
					</span>
				</div>
				<ChevronDown
					className={cn(
						"h-4 w-4 text-muted-foreground transition-transform",
						isExpanded && "rotate-180",
					)}
				/>
			</button>
			{isExpanded && (
				<div className="divide-y">
					{components.length === 0 ? (
						<div className="py-6 text-center text-sm text-muted-foreground">
							No components in this group
						</div>
					) : (
						components.map((component) => (
							<ComponentRow
								key={component.componentId}
								component={component}
								onStatusChange={onStatusChange}
								onEdit={onEditComponent}
								onDelete={onDeleteComponent}
								isUpdating={isUpdating}
							/>
						))
					)}
				</div>
			)}
		</div>
	);
}

/**
 * Empty state when no components exist
 */
function EmptyState({ onAddComponent }: { onAddComponent?: () => void }) {
	return (
		<div className="rounded-lg border bg-card">
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<Server className="h-12 w-12 text-muted-foreground/50" />
				<h3 className="mt-4 text-lg font-medium">No components yet</h3>
				<p className="mt-2 text-sm text-muted-foreground max-w-sm">
					Components represent the different services and systems on your status
					page. Add your first component to get started.
				</p>
				{onAddComponent && (
					<Button onClick={onAddComponent} className="mt-6">
						<Plus className="h-4 w-4" />
						Add Component
					</Button>
				)}
			</div>
		</div>
	);
}

/**
 * ComponentList displays all components grouped by their component groups,
 * with ungrouped components shown separately at the bottom.
 */
export function ComponentList({
	components,
	groups,
	onStatusChange,
	onAddComponent,
	onAddGroup,
	onEditComponent,
	onDeleteComponent,
	isUpdating,
}: ComponentListProps) {
	// Group components by their groupId
	const groupedComponents = new Map<string | null, ComponentData[]>();

	// Initialize groups
	for (const group of groups) {
		groupedComponents.set(group.groupId, []);
	}
	groupedComponents.set(null, []); // For ungrouped components

	// Sort components into their groups
	for (const component of components) {
		const groupId = component.groupId;
		const existing = groupedComponents.get(groupId) || [];
		existing.push(component);
		groupedComponents.set(groupId, existing);
	}

	// Sort components within each group by position
	for (const [groupId, comps] of groupedComponents) {
		comps.sort((a, b) => a.position - b.position);
		groupedComponents.set(groupId, comps);
	}

	// Sort groups by position
	const sortedGroups = [...groups].sort((a, b) => a.position - b.position);

	const ungroupedComponents = groupedComponents.get(null) || [];

	// If no components at all, show empty state
	if (components.length === 0) {
		return <EmptyState onAddComponent={onAddComponent} />;
	}

	return (
		<div className="space-y-6">
			{/* Action buttons */}
			<div className="flex items-center gap-3">
				<Button onClick={onAddComponent}>
					<Plus className="h-4 w-4" />
					Add Component
				</Button>
				<Button variant="outline" onClick={onAddGroup}>
					<FolderOpen className="h-4 w-4" />
					Add Group
				</Button>
			</div>

			{/* Grouped components */}
			{sortedGroups.map((group) => {
				const groupComponents = groupedComponents.get(group.groupId) || [];
				return (
					<ComponentGroupSection
						key={group.groupId}
						group={group}
						components={groupComponents}
						onStatusChange={onStatusChange}
						onEditComponent={onEditComponent}
						onDeleteComponent={onDeleteComponent}
						isUpdating={isUpdating}
					/>
				);
			})}

			{/* Ungrouped components */}
			{ungroupedComponents.length > 0 && (
				<div className="border rounded-lg overflow-hidden">
					<div className="px-4 py-3 bg-muted/30">
						<div className="flex items-center gap-2">
							<Server className="h-4 w-4 text-muted-foreground" />
							<span className="font-medium text-sm">Ungrouped Components</span>
							<span className="text-xs text-muted-foreground">
								({ungroupedComponents.length} component
								{ungroupedComponents.length !== 1 ? "s" : ""})
							</span>
						</div>
					</div>
					<div className="divide-y">
						{ungroupedComponents.map((component) => (
							<ComponentRow
								key={component.componentId}
								component={component}
								onStatusChange={onStatusChange}
								onEdit={onEditComponent}
								onDelete={onDeleteComponent}
								isUpdating={isUpdating}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

export default ComponentList;
