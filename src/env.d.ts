type Runtime = import("@astrojs/cloudflare").Runtime<Env>;
type SubdomainRouteResult = import("./middleware").SubdomainRouteResult;

declare namespace App {
	interface Locals extends Runtime {
		/**
		 * Subdomain routing result resolved by middleware.
		 * Contains information about which type of page should be rendered.
		 */
		subdomainRoute: SubdomainRouteResult;
	}
}
