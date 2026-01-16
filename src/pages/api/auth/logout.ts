import type { APIContext } from "astro";
import { createDb } from "../../../db/client";
import {
	clearSessionCookie,
	destroySession,
	getSessionCookie,
} from "../../../lib/auth";

export const prerender = false;

interface LogoutResponse {
	success: boolean;
	message?: string;
}

/**
 * POST /api/auth/logout
 *
 * Logs out the current user by destroying their session.
 *
 * Response:
 * - 200: Logout successful
 * - 500: Internal server error
 */
export async function POST(context: APIContext): Promise<Response> {
	try {
		const sessionId = getSessionCookie(context.cookies);

		if (sessionId) {
			// Get database connection
			const db = createDb(context.locals.runtime.env.DB);

			// Destroy session in database
			await destroySession(db, sessionId);
		}

		// Clear session cookie (even if no session exists)
		clearSessionCookie(context.cookies);

		return new Response(
			JSON.stringify({
				success: true,
				message: "Logged out successfully",
			} as LogoutResponse),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Logout error:", error);

		// Still clear the cookie even on error
		clearSessionCookie(context.cookies);

		return new Response(
			JSON.stringify({
				success: false,
				message: "An error occurred during logout",
			} as LogoutResponse),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
