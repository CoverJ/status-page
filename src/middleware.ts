import type { MiddlewareHandler } from "astro";
import { createDb } from "./db/client";
import { PageRepository } from "./db/repositories";
import type { Page, Session, User } from "./db/types";
import { getSessionCookie, refreshSession, validateSession } from "./lib/auth";

/**
 * Reserved subdomains that cannot be used for status pages.
 * These are used for platform infrastructure.
 */
export const RESERVED_SUBDOMAINS = [
	"www",
	"app",
	"api",
	"admin",
	"status",
	"mail",
] as const;

export type ReservedSubdomain = (typeof RESERVED_SUBDOMAINS)[number];

/**
 * Result of subdomain routing resolution.
 */
export type SubdomainRouteResult =
	| { type: "root" }
	| { type: "reserved"; subdomain: ReservedSubdomain }
	| { type: "status-page"; subdomain: string; page: Page }
	| { type: "not-found"; subdomain: string };

/**
 * Extract subdomain from hostname.
 * Returns null if no subdomain or if it's the root domain.
 *
 * @example
 * extractSubdomain("acme.downtime.online") // "acme"
 * extractSubdomain("downtime.online") // null
 * extractSubdomain("localhost:4321") // null
 */
export function extractSubdomain(hostname: string): string | null {
	// Remove port if present
	const host = hostname.split(":")[0];

	// Handle localhost - no subdomains
	if (host === "localhost" || host === "127.0.0.1") {
		return null;
	}

	// Split hostname into parts
	const parts = host.split(".");

	// Need at least 3 parts for a subdomain (sub.domain.tld)
	if (parts.length < 3) {
		return null;
	}

	// Return the first part as the subdomain
	return parts[0].toLowerCase();
}

/**
 * Check if a subdomain is reserved.
 */
export function isReservedSubdomain(
	subdomain: string,
): subdomain is ReservedSubdomain {
	return RESERVED_SUBDOMAINS.includes(subdomain as ReservedSubdomain);
}

/**
 * Resolve the routing for a given hostname.
 * Uses KV cache first, falls back to D1 database lookup.
 */
async function resolveSubdomainRoute(
	hostname: string,
	env: Env,
): Promise<SubdomainRouteResult> {
	const subdomain = extractSubdomain(hostname);

	// No subdomain means root domain
	if (!subdomain) {
		return { type: "root" };
	}

	// Check for reserved subdomains
	if (isReservedSubdomain(subdomain)) {
		return { type: "reserved", subdomain };
	}

	// Try KV cache first for performance
	const cacheKey = `subdomain:${subdomain}`;
	const cached = await env.SESSIONS.get(cacheKey, "json");

	if (cached) {
		return {
			type: "status-page",
			subdomain,
			page: cached as Page,
		};
	}

	// Fall back to database lookup
	const db = createDb(env.DB);
	const page = await PageRepository.findBySubdomain(db, subdomain);

	if (!page) {
		return { type: "not-found", subdomain };
	}

	// Cache the result for 5 minutes
	await env.SESSIONS.put(cacheKey, JSON.stringify(page), {
		expirationTtl: 300,
	});

	return { type: "status-page", subdomain, page };
}

/**
 * Auth context for authenticated users.
 */
export interface AuthLocals {
	user: User;
	session: Session;
}

/**
 * Public API routes that don't require authentication.
 * These are auth-related endpoints that must be accessible to unauthenticated users.
 */
const PUBLIC_API_ROUTES = [
	"/api/auth/login",
	"/api/auth/logout",
	"/api/auth/signup",
	"/api/auth/magic-link",
	"/api/auth/verify-magic-link",
	"/api/auth/forgot-password",
	"/api/auth/reset-password",
] as const;

/**
 * Check if a path is a public API route.
 */
function isPublicApiRoute(pathname: string): boolean {
	return PUBLIC_API_ROUTES.some((route) => pathname === route);
}

/**
 * Check if a path is a protected dashboard route.
 * Dashboard routes are under /dashboard/*
 */
function isDashboardRoute(pathname: string): boolean {
	return pathname.startsWith("/dashboard");
}

/**
 * Check if a path is a protected API route.
 * API routes are under /api/* except for public auth endpoints.
 */
function isProtectedApiRoute(pathname: string): boolean {
	return pathname.startsWith("/api/") && !isPublicApiRoute(pathname);
}

/**
 * Create a 401 Unauthorized JSON response for API routes.
 */
function createUnauthorizedApiResponse(): Response {
	return new Response(
		JSON.stringify({
			success: false,
			error: "Unauthorized",
			message: "Authentication required",
		}),
		{
			status: 401,
			headers: { "Content-Type": "application/json" },
		},
	);
}

/**
 * Create a redirect response to the login page.
 */
function createLoginRedirect(returnUrl?: string): Response {
	const loginUrl = returnUrl
		? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
		: "/login";
	return new Response(null, {
		status: 302,
		headers: { Location: loginUrl },
	});
}

/**
 * Astro middleware for subdomain-based routing and authentication.
 *
 * Routing logic:
 * - Root domain (downtime.online): Marketing/landing page
 * - app.downtime.online: Admin dashboard
 * - api.downtime.online: API endpoints
 * - {subdomain}.downtime.online: Customer status page
 * - Unknown subdomains: 404 page
 *
 * Authentication:
 * - Dashboard routes (/dashboard/*): Require auth, redirect to login if not authenticated
 * - API routes (/api/*): Require auth (except public auth endpoints), return 401 if not authenticated
 * - Session refresh: Extends session expiry on activity
 */
export const onRequest: MiddlewareHandler = async (context, next) => {
	const { request, locals, cookies } = context;
	const url = new URL(request.url);
	const hostname = url.hostname;
	const pathname = url.pathname;

	// Get environment bindings from Cloudflare runtime
	const env = locals.runtime.env;

	// Resolve subdomain routing
	const routeResult = await resolveSubdomainRoute(hostname, env);

	// Store routing info in locals for downstream handlers
	locals.subdomainRoute = routeResult;

	// Handle not-found subdomains
	if (routeResult.type === "not-found") {
		// Return 404 response for unknown subdomains
		return new Response("Status page not found", {
			status: 404,
			headers: {
				"Content-Type": "text/html",
			},
		});
	}

	// Check if this route requires authentication
	const requiresAuth =
		isDashboardRoute(pathname) || isProtectedApiRoute(pathname);

	if (requiresAuth) {
		// Try to validate the session
		const sessionId = getSessionCookie(cookies);

		if (!sessionId) {
			// No session cookie - not authenticated
			if (isProtectedApiRoute(pathname)) {
				return createUnauthorizedApiResponse();
			}
			return createLoginRedirect(pathname);
		}

		// Validate the session
		const db = createDb(env.DB);
		const sessionResult = await validateSession(db, sessionId);

		if (!sessionResult) {
			// Invalid or expired session
			if (isProtectedApiRoute(pathname)) {
				return createUnauthorizedApiResponse();
			}
			return createLoginRedirect(pathname);
		}

		// Session is valid - attach user and session to locals
		locals.user = sessionResult.user;
		locals.session = sessionResult.session;

		// Refresh session on activity (extend expiry if within threshold)
		const isProduction = env.ENVIRONMENT === "production";
		await refreshSession(db, sessionResult.session, cookies, isProduction);
	} else {
		// For non-protected routes, still try to load user info if session exists
		// This allows pages to show personalized content without requiring auth
		const sessionId = getSessionCookie(cookies);
		if (sessionId) {
			const db = createDb(env.DB);
			const sessionResult = await validateSession(db, sessionId);
			if (sessionResult) {
				locals.user = sessionResult.user;
				locals.session = sessionResult.session;

				// Also refresh session on non-protected routes
				const isProduction = env.ENVIRONMENT === "production";
				await refreshSession(db, sessionResult.session, cookies, isProduction);
			}
		}
	}

	// Continue to next middleware/page handler
	return next();
};
