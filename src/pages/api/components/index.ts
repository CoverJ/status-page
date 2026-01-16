import type { APIContext } from "astro";
import { createDb } from "../../../db/client";
import {
	ComponentGroupRepository,
	ComponentRepository,
} from "../../../db/repositories";

export const prerender = false;

interface CreateComponentRequest {
	pageId: string;
	name: string;
	description?: string;
	groupId?: string | null;
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
 * POST /api/components
 *
 * Creates a new component.
 *
 * Request body:
 * - pageId: string (required)
 * - name: string (required, max 100 chars)
 * - description: string (optional)
 * - groupId: string (optional)
 *
 * Response:
 * - 201: Component created successfully
 * - 400: Invalid request (missing/invalid fields)
 * - 500: Internal server error
 */
export async function POST(context: APIContext): Promise<Response> {
	try {
		const body = (await context.request.json()) as CreateComponentRequest;

		// Validate required fields
		if (!body.pageId?.trim()) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Page ID is required",
				} as ComponentResponse),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		if (!body.name?.trim()) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Name is required",
				} as ComponentResponse),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Validate name length (max 100 chars)
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

		// Get database connection
		const db = createDb(context.locals.runtime.env.DB);

		// Validate groupId if provided
		if (body.groupId) {
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

		// Auto-assign position: find max position and add 1
		const existingComponents = await ComponentRepository.findByPageId(
			db,
			body.pageId,
		);
		const maxPosition = existingComponents.reduce(
			(max, c) => Math.max(max, c.position),
			-1,
		);
		const newPosition = maxPosition + 1;

		// Generate component ID
		const componentId = crypto.randomUUID();
		const now = new Date().toISOString();

		// Create component
		const component = await ComponentRepository.create(db, {
			componentId,
			pageId: body.pageId.trim(),
			name: body.name.trim(),
			description: body.description?.trim() || null,
			groupId: body.groupId || null,
			status: "operational",
			position: newPosition,
			showcase: true,
			createdAt: now,
			updatedAt: now,
		});

		return new Response(
			JSON.stringify({
				success: true,
				message: "Component created successfully",
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
				status: 201,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Create component error:", error);
		return new Response(
			JSON.stringify({
				success: false,
				message: "An error occurred while creating the component",
			} as ComponentResponse),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
