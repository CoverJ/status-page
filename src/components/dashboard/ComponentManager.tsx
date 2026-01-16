import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import type { ComponentStatus } from "@/db/schema/constants";
import {
	type ComponentData,
	type ComponentGroupData,
	ComponentList,
} from "./ComponentList";
import { CreateComponentModal } from "./CreateComponentModal";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { EditComponentModal } from "./EditComponentModal";

export interface ComponentManagerProps {
	/**
	 * Initial list of components
	 */
	initialComponents: ComponentData[];
	/**
	 * List of component groups
	 */
	groups: ComponentGroupData[];
	/**
	 * The page ID for new components
	 */
	pageId: string;
	/**
	 * Callback when Add Group button is clicked (for future group management)
	 */
	onAddGroup?: () => void;
}

/**
 * ComponentManager is a container component that handles all component CRUD operations.
 * It manages the modals, toasts, and state updates for component management.
 */
export function ComponentManager({
	initialComponents,
	groups,
	pageId,
	onAddGroup,
}: ComponentManagerProps) {
	// Component list state (local copy that we update on CRUD operations)
	const [components, setComponents] =
		useState<ComponentData[]>(initialComponents);

	// Modal state
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	// Currently selected component for edit/delete
	const [selectedComponent, setSelectedComponent] =
		useState<ComponentData | null>(null);

	// Loading state for status updates
	const [isUpdating, setIsUpdating] = useState(false);

	// Handle Add Component button click
	const handleAddComponent = useCallback(() => {
		setIsCreateModalOpen(true);
	}, []);

	// Handle Edit button click
	const handleEditComponent = useCallback((component: ComponentData) => {
		setSelectedComponent(component);
		setIsEditModalOpen(true);
	}, []);

	// Handle Delete button click
	const handleDeleteComponent = useCallback((component: ComponentData) => {
		setSelectedComponent(component);
		setIsDeleteDialogOpen(true);
	}, []);

	// Handle successful component creation
	const handleCreateSuccess = useCallback(
		(newComponent: {
			componentId: string;
			name: string;
			description: string | null;
			groupId: string | null;
		}) => {
			// Add the new component to the list with default status and position
			const componentData: ComponentData = {
				componentId: newComponent.componentId,
				name: newComponent.name,
				description: newComponent.description,
				groupId: newComponent.groupId,
				status: "operational" as ComponentStatus,
				position: components.length,
			};
			setComponents((prev) => [...prev, componentData]);
			toast.success("Component created", {
				description: `${newComponent.name} has been added to your status page.`,
			});
		},
		[components.length],
	);

	// Handle successful component update
	const handleEditSuccess = useCallback(
		(updatedComponent: {
			componentId: string;
			name: string;
			description: string | null;
			groupId: string | null;
		}) => {
			setComponents((prev) =>
				prev.map((c) =>
					c.componentId === updatedComponent.componentId
						? {
								...c,
								name: updatedComponent.name,
								description: updatedComponent.description,
								groupId: updatedComponent.groupId,
							}
						: c,
				),
			);
			toast.success("Component updated", {
				description: `${updatedComponent.name} has been updated.`,
			});
		},
		[],
	);

	// Handle successful component deletion
	const handleDeleteSuccess = useCallback(
		(componentId: string) => {
			const deletedComponent = components.find(
				(c) => c.componentId === componentId,
			);
			setComponents((prev) =>
				prev.filter((c) => c.componentId !== componentId),
			);
			toast.success("Component deleted", {
				description: deletedComponent
					? `${deletedComponent.name} has been removed.`
					: "Component has been removed.",
			});
		},
		[components],
	);

	// Handle errors
	const handleError = useCallback((message: string) => {
		toast.error("Error", {
			description: message,
		});
	}, []);

	// Handle status change
	const handleStatusChange = useCallback(
		async (componentId: string, newStatus: ComponentStatus) => {
			setIsUpdating(true);

			try {
				const response = await fetch(`/api/components/${componentId}`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ status: newStatus }),
				});

				const data = await response.json();

				if (!response.ok || !data.success) {
					toast.error("Error", {
						description: data.message || "Failed to update status",
					});
					return;
				}

				// Update local state
				setComponents((prev) =>
					prev.map((c) =>
						c.componentId === componentId ? { ...c, status: newStatus } : c,
					),
				);

				toast.success("Status updated", {
					description: `Component status changed to ${newStatus.replace(/_/g, " ")}.`,
				});
			} catch (error) {
				console.error("Error updating status:", error);
				toast.error("Error", {
					description: "An unexpected error occurred",
				});
			} finally {
				setIsUpdating(false);
			}
		},
		[],
	);

	return (
		<>
			<Toaster position="top-right" richColors />

			<ComponentList
				components={components}
				groups={groups}
				onAddComponent={handleAddComponent}
				onAddGroup={onAddGroup}
				onEditComponent={handleEditComponent}
				onDeleteComponent={handleDeleteComponent}
				onStatusChange={handleStatusChange}
				isUpdating={isUpdating}
			/>

			<CreateComponentModal
				open={isCreateModalOpen}
				onOpenChange={setIsCreateModalOpen}
				groups={groups}
				pageId={pageId}
				onSuccess={handleCreateSuccess}
				onError={handleError}
			/>

			<EditComponentModal
				open={isEditModalOpen}
				onOpenChange={(open) => {
					setIsEditModalOpen(open);
					if (!open) setSelectedComponent(null);
				}}
				component={selectedComponent}
				groups={groups}
				onSuccess={handleEditSuccess}
				onError={handleError}
			/>

			<DeleteConfirmDialog
				open={isDeleteDialogOpen}
				onOpenChange={(open) => {
					setIsDeleteDialogOpen(open);
					if (!open) setSelectedComponent(null);
				}}
				component={selectedComponent}
				onSuccess={handleDeleteSuccess}
				onError={handleError}
			/>
		</>
	);
}

export default ComponentManager;
