type Runtime = import("@astrojs/cloudflare").Runtime<Env>;
type SubdomainRouteResult = import("./middleware").SubdomainRouteResult;
type User = import("./db/types").User;
type Session = import("./db/types").Session;

declare namespace App {
	interface Locals extends Runtime {
		/**
		 * Subdomain routing result resolved by middleware.
		 * Contains information about which type of page should be rendered.
		 */
		subdomainRoute: SubdomainRouteResult;

		/**
		 * Current authenticated user.
		 * Populated by auth middleware for authenticated requests.
		 * Will be undefined for unauthenticated requests.
		 */
		user?: User;

		/**
		 * Current session.
		 * Populated by auth middleware for authenticated requests.
		 * Will be undefined for unauthenticated requests.
		 */
		session?: Session;
	}
}
