import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type Database = DrizzleD1Database<typeof schema>;

/**
 * Creates a Drizzle database client from a D1Database binding.
 * Use within Cloudflare Workers request context.
 *
 * @example
 * ```ts
 * // In an Astro API route or page
 * const db = createDb(Astro.locals.runtime.env.DB);
 * const allPages = await db.select().from(schema.pages);
 * ```
 */
export function createDb(d1: D1Database): Database {
	return drizzle(d1, { schema });
}
