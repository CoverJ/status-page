import type { APIContext } from "astro";
import { createDb } from "../../../db/client";
import {
	ComponentRepository,
	ComponentGroupRepository,
} from "../../../db/repositories";
import {
	COMPONENT_STATUSES,
	type ComponentStatus,
} from "../../../db/schema/constants";

export const prerender = false;

interface UpdateComponentRequest {
	name?: string;
	description?: string | null;
	groupId?: string | null;
	status?: ComponentStatus;
}

interface ComponentResponse {
	success: boolean;
	message?: string;
	component?: {
		componentId: string;
		pageId: string;
		name: string;
		description: string | null;
		groupId: string | null;
		status: string;
		position: number;
	};
}

/**
 * PUT /api/components/[id]
 *
 * Updates an existing component.
 *
 * Request body (all optional):
 * - name: string (max 100 chars)
 * - description: string | null
 * - groupId: string | null
 *
 * Response:
 * - 200: Component updated successfully
 * - 400: Invalid request
 * - 404: Component not found
 * - 500: Internal server error
 */
export async function PUT(context: APIContext): Promise<Response> {
	try {
		const componentId = context.params.id;

		if (!componentId) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Component ID is required",
				} as ComponentResponse),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const body = (await context.request.json()) as UpdateComponentRequest;

		// Get database connection
		const db = createDb(context.locals.runtime.env.DB);

		// Check if component exists
		const existingComponent = await ComponentRepository.findById(
			db,
			componentId,
		);
		if (!existingComponent) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Component not found",
				} as ComponentResponse),
				{
					status: 404,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Validate name if provided
		if (body.name !== undefined) {
			if (!body.name?.trim()) {
				return new Response(
					JSON.stringify({
						success: false,
						message: "Name cannot be empty",
					} as ComponentResponse),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			if (body.name.trim().length > 100) {
				return new Response(
					JSON.stringify({
						success: false,
						message: "Name must be 100 characters or less",
					} as ComponentResponse),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
		}

		// Validate groupId if provided and not null
		if (body.groupId !== undefined && body.groupId !== null) {
			const group = await ComponentGroupRepository.findById(db, body.groupId);
			if (!group) {
				return new Response(
					JSON.stringify({
						success: false,
						message: "Invalid group ID",
					} as ComponentResponse),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
		}

		// Validate status if provided
		if (
			body.status !== undefined &&
			!COMPONENT_STATUSES.includes(body.status)
		) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Invalid status value",
				} as ComponentResponse),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Build update data
		const updateData: Partial<{
			name: string;
			description: string | null;
			groupId: string | null;
			status: ComponentStatus;
		}> = {};

		if (body.name !== undefined) {
			updateData.name = body.name.trim();
		}
		if (body.description !== undefined) {
			updateData.description = body.description?.trim() || null;
		}
		if (body.groupId !== undefined) {
			updateData.groupId = body.groupId;
		}
		if (body.status !== undefined) {
			updateData.status = body.status;
		}

		// Update component
		const component = await ComponentRepository.update(
			db,
			componentId,
			updateData,
		);

		if (!component) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Failed to update component",
				} as ComponentResponse),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		return new Response(
			JSON.stringify({
				success: true,
				message: "Component updated successfully",
				component: {
					componentId: component.componentId,
					pageId: component.pageId,
					name: component.name,
					description: component.description,
					groupId: component.groupId,
					status: component.status,
					position: component.position,
				},
			} as ComponentResponse),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Update component error:", error);
		return new Response(
			JSON.stringify({
				success: false,
				message: "An error occurred while updating the component",
			} as ComponentResponse),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}

/**
 * DELETE /api/components/[id]
 *
 * Deletes a component.
 *
 * Response:
 * - 200: Component deleted successfully
 * - 400: Invalid request
 * - 404: Component not found
 * - 500: Internal server error
 */
export async function DELETE(context: APIContext): Promise<Response> {
	try {
		const componentId = context.params.id;

		if (!componentId) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Component ID is required",
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Get database connection
		const db = createDb(context.locals.runtime.env.DB);

		// Check if component exists
		const existingComponent = await ComponentRepository.findById(
			db,
			componentId,
		);
		if (!existingComponent) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Component not found",
				}),
				{
					status: 404,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Delete component (hard delete for MVP)
		const deleted = await ComponentRepository.delete(db, componentId);

		if (!deleted) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Failed to delete component",
				}),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		return new Response(
			JSON.stringify({
				success: true,
				message: "Component deleted successfully",
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Delete component error:", error);
		return new Response(
			JSON.stringify({
				success: false,
				message: "An error occurred while deleting the component",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
