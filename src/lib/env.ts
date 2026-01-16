import { z } from "zod";

export const envSchema = z.object({
	// App environment
	ENVIRONMENT: z
		.enum(["development", "staging", "production"])
		.default("development"),

	// Resend API (for email notifications - Epic 8)
	RESEND_API_KEY: z.string().optional(),

	// App URL for magic links
	APP_URL: z.string().url().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(env: Record<string, unknown>): AppEnv {
	return envSchema.parse(env);
}
