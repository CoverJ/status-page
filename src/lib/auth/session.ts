/**
 * Session management utilities for HTTP-only cookie-based authentication.
 */

import type { AstroCookies } from "astro";
import type { Database } from "../../db/client";
import { SessionRepository, UserRepository } from "../../db/repositories";
import type { Session, User } from "../../db/types";

const SESSION_COOKIE_NAME = "session_id";
const SESSION_DURATION_DAYS = 30;

/**
 * Generates a cryptographically secure session ID.
 */
export function generateSessionId(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

/**
 * Generates a unique user ID.
 */
export function generateUserId(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(16));
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

/**
 * Calculates the session expiry date (30 days from now).
 */
export function getSessionExpiry(): Date {
	const expiry = new Date();
	expiry.setDate(expiry.getDate() + SESSION_DURATION_DAYS);
	return expiry;
}

/**
 * Creates a new session for a user and stores it in the database.
 *
 * @param db - Database connection
 * @param userId - The user's ID
 * @returns The created session
 */
export async function createSession(
	db: Database,
	userId: string,
): Promise<Session> {
	const sessionId = generateSessionId();
	const expiresAt = getSessionExpiry();
	const now = new Date().toISOString();

	return SessionRepository.create(db, {
		sessionId,
		userId,
		expiresAt: expiresAt.toISOString(),
		createdAt: now,
	});
}

/**
 * Sets the session cookie in the response.
 *
 * @param cookies - Astro cookies object
 * @param sessionId - The session ID to set
 * @param isSecure - Whether to set the Secure flag (true in production)
 */
export function setSessionCookie(
	cookies: AstroCookies,
	sessionId: string,
	isSecure = true,
): void {
	const expiry = getSessionExpiry();

	cookies.set(SESSION_COOKIE_NAME, sessionId, {
		httpOnly: true,
		secure: isSecure,
		sameSite: "lax",
		path: "/",
		expires: expiry,
	});
}

/**
 * Gets the session ID from the request cookies.
 *
 * @param cookies - Astro cookies object
 * @returns The session ID or undefined if not present
 */
export function getSessionCookie(cookies: AstroCookies): string | undefined {
	return cookies.get(SESSION_COOKIE_NAME)?.value;
}

/**
 * Clears the session cookie from the response.
 *
 * @param cookies - Astro cookies object
 */
export function clearSessionCookie(cookies: AstroCookies): void {
	cookies.delete(SESSION_COOKIE_NAME, {
		path: "/",
	});
}

/**
 * Validates a session and returns the associated user if valid.
 *
 * @param db - Database connection
 * @param sessionId - The session ID to validate
 * @returns The user associated with the session, or null if invalid/expired
 */
export async function validateSession(
	db: Database,
	sessionId: string,
): Promise<{ session: Session; user: User } | null> {
	const session = await SessionRepository.findValid(db, sessionId);
	if (!session) {
		return null;
	}

	const user = await UserRepository.findById(db, session.userId);
	if (!user) {
		// Session exists but user doesn't - clean up orphaned session
		await SessionRepository.delete(db, sessionId);
		return null;
	}

	return { session, user };
}

/**
 * Destroys a session by deleting it from the database.
 *
 * @param db - Database connection
 * @param sessionId - The session ID to destroy
 * @returns True if the session was deleted, false if it didn't exist
 */
export async function destroySession(
	db: Database,
	sessionId: string,
): Promise<boolean> {
	return SessionRepository.delete(db, sessionId);
}

/**
 * Refresh threshold in days. Sessions will be refreshed if they expire
 * within this many days.
 */
const REFRESH_THRESHOLD_DAYS = 15;

/**
 * Refreshes a session's expiry if it's within the refresh threshold.
 * This implements session sliding - extending the session on user activity.
 *
 * @param db - Database connection
 * @param session - The session to potentially refresh
 * @param cookies - Astro cookies object to update the cookie expiry
 * @param isSecure - Whether to set the Secure flag on the cookie
 * @returns True if the session was refreshed, false otherwise
 */
export async function refreshSession(
	db: Database,
	session: Session,
	cookies: AstroCookies,
	isSecure = true,
): Promise<boolean> {
	const expiresAt = new Date(session.expiresAt);
	const now = new Date();
	const daysUntilExpiry =
		(expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

	// Only refresh if within the threshold
	if (daysUntilExpiry > REFRESH_THRESHOLD_DAYS) {
		return false;
	}

	// Calculate new expiry
	const newExpiry = getSessionExpiry();

	// Update session in database
	await SessionRepository.updateExpiry(db, session.sessionId, newExpiry);

	// Update the cookie with the new expiry
	setSessionCookie(cookies, session.sessionId, isSecure);

	return true;
}
