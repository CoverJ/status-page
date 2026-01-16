/**
 * Auth guards and utilities for Astro pages and API routes.
 */

import type { APIContext, AstroGlobal } from "astro";
import { createDb, type Database } from "../../db/client";
import { TeamMemberRepository } from "../../db/repositories";
import type { Session, User } from "../../db/types";
import {
	getSessionCookie,
	refreshSession,
	validateSession,
} from "./session";

/**
 * Auth context containing the current user and session.
 */
export interface AuthContext {
	user: User;
	session: Session;
}

/**
 * Result of getCurrentUser when user is not authenticated.
 */
export type AuthResult =
	| { authenticated: true; user: User; session: Session }
	| { authenticated: false; user: null; session: null };

/**
 * Gets the current authenticated user from an Astro page or API context.
 * This function validates the session cookie and returns the user if valid.
 *
 * @param context - Astro page or API context
 * @returns The authenticated user and session, or null values if not authenticated
 *
 * @example
 * ```ts
 * // In an Astro page
 * const auth = await getCurrentUser(Astro);
 * if (!auth.authenticated) {
 *   return Astro.redirect('/login');
 * }
 * const { user } = auth;
 * ```
 */
export async function getCurrentUser(
	context: AstroGlobal | APIContext,
): Promise<AuthResult> {
	const sessionId = getSessionCookie(context.cookies);
	if (!sessionId) {
		return { authenticated: false, user: null, session: null };
	}

	const db = createDb(context.locals.runtime.env.DB);
	const result = await validateSession(db, sessionId);

	if (!result) {
		return { authenticated: false, user: null, session: null };
	}

	return {
		authenticated: true,
		user: result.user,
		session: result.session,
	};
}

/**
 * Checks if a user has access to a specific page (team membership check).
 *
 * @param db - Database connection
 * @param userId - User ID to check
 * @param pageId - Page ID to check access for
 * @returns True if user has access to the page
 */
export async function hasPageAccess(
	db: Database,
	userId: string,
	pageId: string,
): Promise<boolean> {
	return TeamMemberRepository.isMember(db, pageId, userId);
}

/**
 * Checks if a user has a specific role on a page.
 *
 * @param db - Database connection
 * @param userId - User ID to check
 * @param pageId - Page ID to check
 * @param role - Required role (e.g., 'admin', 'member')
 * @returns True if user has the specified role
 */
export async function hasPageRole(
	db: Database,
	userId: string,
	pageId: string,
	role: string,
): Promise<boolean> {
	return TeamMemberRepository.hasRole(db, pageId, userId, role);
}

/**
 * Helper to refresh session on activity. Call this after validating a session
 * to extend its expiry if it's within the refresh threshold.
 *
 * @param context - Astro page or API context
 * @param session - The validated session
 */
export async function refreshSessionOnActivity(
	context: AstroGlobal | APIContext,
	session: Session,
): Promise<void> {
	const db = createDb(context.locals.runtime.env.DB);
	const isProduction = context.locals.runtime.env.ENVIRONMENT === "production";
	await refreshSession(db, session, context.cookies, isProduction);
}

/**
 * Unauthorized response for API endpoints.
 */
export function unauthorizedResponse(message = "Unauthorized"): Response {
	return new Response(
		JSON.stringify({
			success: false,
			error: message,
		}),
		{
			status: 401,
			headers: { "Content-Type": "application/json" },
		},
	);
}

/**
 * Forbidden response for API endpoints (authenticated but lacking permission).
 */
export function forbiddenResponse(message = "Forbidden"): Response {
	return new Response(
		JSON.stringify({
			success: false,
			error: message,
		}),
		{
			status: 403,
			headers: { "Content-Type": "application/json" },
		},
	);
}
