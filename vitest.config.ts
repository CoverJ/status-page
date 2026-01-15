/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

export default getViteConfig({
	test: {
		include: ["src/**/*.test.{ts,tsx}", "tests/unit/**/*.test.{ts,tsx}"],
		exclude: ["node_modules", "dist", "tests/e2e"],
		testTimeout: 20000,
		hookTimeout: 20000,
		teardownTimeout: 5000,
	},
});
