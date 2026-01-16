import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { ComponentData } from "./ComponentList";

export interface DeleteConfirmDialogProps {
	/**
	 * Whether the dialog is open
	 */
	open: boolean;
	/**
	 * Callback when the dialog should close
	 */
	onOpenChange: (open: boolean) => void;
	/**
	 * The component to delete
	 */
	component: ComponentData | null;
	/**
	 * Callback when deletion is successful
	 */
	onSuccess?: (componentId: string) => void;
	/**
	 * Callback when an error occurs
	 */
	onError?: (message: string) => void;
}

/**
 * Confirmation dialog for deleting a component
 */
export function DeleteConfirmDialog({
	open,
	onOpenChange,
	component,
	onSuccess,
	onError,
}: DeleteConfirmDialogProps) {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleClose = () => {
		if (!isDeleting) {
			onOpenChange(false);
		}
	};

	const handleDelete = async () => {
		if (!component) {
			return;
		}

		setIsDeleting(true);

		try {
			const response = await fetch(`/api/components/${component.componentId}`, {
				method: "DELETE",
			});

			const data = await response.json();

			if (!response.ok || !data.success) {
				onError?.(data.message || "Failed to delete component");
				return;
			}

			onSuccess?.(component.componentId);
			onOpenChange(false);
		} catch (error) {
			console.error("Error deleting component:", error);
			onError?.("An unexpected error occurred");
		} finally {
			setIsDeleting(false);
		}
	};

	if (!component) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
							<AlertTriangle className="h-5 w-5 text-destructive" />
						</div>
						<DialogTitle>Delete Component</DialogTitle>
					</div>
					<DialogDescription className="pt-2">
						Are you sure you want to delete{" "}
						<span className="font-medium text-foreground">
							{component.name}
						</span>
						? This action cannot be undone.
					</DialogDescription>
				</DialogHeader>

				<div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
					<p>Deleting this component will:</p>
					<ul className="mt-2 list-inside list-disc space-y-1">
						<li>Remove it from your status page</li>
						<li>Remove any associations with incidents</li>
					</ul>
				</div>

				<DialogFooter className="gap-2 sm:gap-0">
					<Button
						type="button"
						variant="outline"
						onClick={handleClose}
						disabled={isDeleting}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="destructive"
						onClick={handleDelete}
						disabled={isDeleting}
					>
						{isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
						{isDeleting ? "Deleting..." : "Delete Component"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default DeleteConfirmDialog;
