import type { APIContext } from "astro";
import { createDb } from "../../../db/client";
import { UserRepository } from "../../../db/repositories";
import {
	createSession,
	generateUserId,
	hashPassword,
	setSessionCookie,
	validatePasswordStrength,
} from "../../../lib/auth";

export const prerender = false;

interface SignupRequest {
	email: string;
	password: string;
	name: string;
}

interface SignupResponse {
	success: boolean;
	message?: string;
	errors?: string[];
	user?: {
		userId: string;
		email: string;
		name: string;
	};
}

/**
 * POST /api/auth/signup
 *
 * Creates a new user account with password authentication.
 *
 * Request body:
 * - email: string (required)
 * - password: string (required)
 * - name: string (required)
 *
 * Response:
 * - 201: User created successfully
 * - 400: Invalid request (validation errors)
 * - 409: Email already exists
 * - 500: Internal server error
 */
export async function POST(context: APIContext): Promise<Response> {
	try {
		const body = (await context.request.json()) as SignupRequest;

		// Validate required fields
		const errors: string[] = [];
		if (!body.email?.trim()) {
			errors.push("Email is required");
		}
		if (!body.password) {
			errors.push("Password is required");
		}
		if (!body.name?.trim()) {
			errors.push("Name is required");
		}

		if (errors.length > 0) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Validation failed",
					errors,
				} as SignupResponse),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(body.email)) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Validation failed",
					errors: ["Invalid email format"],
				} as SignupResponse),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Validate password strength
		const passwordValidation = validatePasswordStrength(body.password);
		if (!passwordValidation.valid) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Password does not meet requirements",
					errors: passwordValidation.errors,
				} as SignupResponse),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Get database connection
		const db = createDb(context.locals.runtime.env.DB);

		// Check if email already exists
		const existingUser = await UserRepository.findByEmail(
			db,
			body.email.toLowerCase(),
		);
		if (existingUser) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "An account with this email already exists",
				} as SignupResponse),
				{
					status: 409,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Hash password
		const passwordHash = await hashPassword(body.password);

		// Create user
		const now = new Date().toISOString();
		const user = await UserRepository.create(db, {
			userId: generateUserId(),
			email: body.email.toLowerCase().trim(),
			passwordHash,
			name: body.name.trim(),
			createdAt: now,
			updatedAt: now,
		});

		// Create session
		const session = await createSession(db, user.userId);

		// Set session cookie
		const isProduction = context.locals.runtime.env.ENVIRONMENT === "production";
		setSessionCookie(context.cookies, session.sessionId, isProduction);

		// Update last login time
		await UserRepository.update(db, user.userId, {
			lastLoginAt: now,
		});

		return new Response(
			JSON.stringify({
				success: true,
				message: "Account created successfully",
				user: {
					userId: user.userId,
					email: user.email,
					name: user.name,
				},
			} as SignupResponse),
			{
				status: 201,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Signup error:", error);
		return new Response(
			JSON.stringify({
				success: false,
				message: "An error occurred during signup",
			} as SignupResponse),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
