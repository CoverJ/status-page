import type { MiddlewareHandler } from "astro";
import { createDb } from "./db/client";
import { PageRepository } from "./db/repositories";
import type { Page } from "./db/types";

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
 * Astro middleware for subdomain-based routing.
 *
 * Routing logic:
 * - Root domain (downtime.online): Marketing/landing page
 * - app.downtime.online: Admin dashboard
 * - api.downtime.online: API endpoints
 * - {subdomain}.downtime.online: Customer status page
 * - Unknown subdomains: 404 page
 */
export const onRequest: MiddlewareHandler = async (context, next) => {
	const { request, locals } = context;
	const url = new URL(request.url);
	const hostname = url.hostname;

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

	// Continue to next middleware/page handler
	return next();
};
