import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ComponentGroupData } from "./ComponentList";

export interface CreateComponentModalProps {
	/**
	 * Whether the modal is open
	 */
	open: boolean;
	/**
	 * Callback when the modal should close
	 */
	onOpenChange: (open: boolean) => void;
	/**
	 * Available groups for selection
	 */
	groups: ComponentGroupData[];
	/**
	 * The page ID for the new component
	 */
	pageId: string;
	/**
	 * Callback when a component is successfully created
	 */
	onSuccess?: (component: {
		componentId: string;
		name: string;
		description: string | null;
		groupId: string | null;
	}) => void;
	/**
	 * Callback when an error occurs
	 */
	onError?: (message: string) => void;
}

const MAX_NAME_LENGTH = 100;

/**
 * Modal dialog for creating a new component
 */
export function CreateComponentModal({
	open,
	onOpenChange,
	groups,
	pageId,
	onSuccess,
	onError,
}: CreateComponentModalProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [groupId, setGroupId] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [nameError, setNameError] = useState<string | null>(null);

	const resetForm = () => {
		setName("");
		setDescription("");
		setGroupId(null);
		setNameError(null);
	};

	const handleClose = () => {
		if (!isSubmitting) {
			resetForm();
			onOpenChange(false);
		}
	};

	const validateName = (value: string): boolean => {
		if (!value.trim()) {
			setNameError("Name is required");
			return false;
		}
		if (value.trim().length > MAX_NAME_LENGTH) {
			setNameError(`Name must be ${MAX_NAME_LENGTH} characters or less`);
			return false;
		}
		setNameError(null);
		return true;
	};

	const handleNameChange = (value: string) => {
		setName(value);
		if (nameError) {
			validateName(value);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateName(name)) {
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await fetch("/api/components", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					pageId,
					name: name.trim(),
					description: description.trim() || null,
					groupId,
				}),
			});

			const data = await response.json();

			if (!response.ok || !data.success) {
				onError?.(data.message || "Failed to create component");
				return;
			}

			onSuccess?.(data.component);
			resetForm();
			onOpenChange(false);
		} catch (error) {
			console.error("Error creating component:", error);
			onError?.("An unexpected error occurred");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[425px]">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Add Component</DialogTitle>
						<DialogDescription>
							Create a new component to track on your status page.
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="name">
								Name <span className="text-destructive">*</span>
							</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => handleNameChange(e.target.value)}
								placeholder="e.g., API Server"
								maxLength={MAX_NAME_LENGTH}
								aria-invalid={!!nameError}
								disabled={isSubmitting}
							/>
							{nameError && (
								<p className="text-sm text-destructive">{nameError}</p>
							)}
							<p className="text-xs text-muted-foreground">
								{name.length}/{MAX_NAME_LENGTH} characters
							</p>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Brief description of this component"
								rows={3}
								disabled={isSubmitting}
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="group">Group</Label>
							<Select
								value={groupId || "none"}
								onValueChange={(value) =>
									setGroupId(value === "none" ? null : value)
								}
								disabled={isSubmitting}
							>
								<SelectTrigger id="group" className="w-full">
									<SelectValue placeholder="Select a group (optional)" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">No group</SelectItem>
									{groups.map((group) => (
										<SelectItem key={group.groupId} value={group.groupId}>
											{group.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">
								Optionally group this component with related services
							</p>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
							{isSubmitting ? "Creating..." : "Create Component"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export default CreateComponentModal;
