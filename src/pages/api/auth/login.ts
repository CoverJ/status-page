import type { APIContext } from "astro";
import { createDb } from "../../../db/client";
import { UserRepository } from "../../../db/repositories";
import {
	createSession,
	setSessionCookie,
	verifyPassword,
} from "../../../lib/auth";

export const prerender = false;

interface LoginRequest {
	email: string;
	password: string;
}

interface LoginResponse {
	success: boolean;
	message?: string;
	user?: {
		userId: string;
		email: string;
		name: string;
	};
}

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password.
 *
 * Request body:
 * - email: string (required)
 * - password: string (required)
 *
 * Response:
 * - 200: Login successful
 * - 400: Invalid request (missing fields)
 * - 401: Invalid credentials
 * - 500: Internal server error
 */
export async function POST(context: APIContext): Promise<Response> {
	try {
		const body = (await context.request.json()) as LoginRequest;

		// Validate required fields
		if (!body.email?.trim() || !body.password) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Email and password are required",
				} as LoginResponse),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Get database connection
		const db = createDb(context.locals.runtime.env.DB);

		// Find user by email
		const user = await UserRepository.findByEmail(
			db,
			body.email.toLowerCase().trim(),
		);

		// If user doesn't exist or doesn't have a password (magic link only)
		if (!user || !user.passwordHash) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Invalid email or password",
				} as LoginResponse),
				{
					status: 401,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Verify password
		const isValidPassword = await verifyPassword(body.password, user.passwordHash);
		if (!isValidPassword) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Invalid email or password",
				} as LoginResponse),
				{
					status: 401,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Create session
		const session = await createSession(db, user.userId);

		// Set session cookie
		const isProduction = context.locals.runtime.env.ENVIRONMENT === "production";
		setSessionCookie(context.cookies, session.sessionId, isProduction);

		// Update last login time
		await UserRepository.update(db, user.userId, {
			lastLoginAt: new Date().toISOString(),
		});

		return new Response(
			JSON.stringify({
				success: true,
				message: "Login successful",
				user: {
					userId: user.userId,
					email: user.email,
					name: user.name,
				},
			} as LoginResponse),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Login error:", error);
		return new Response(
			JSON.stringify({
				success: false,
				message: "An error occurred during login",
			} as LoginResponse),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
