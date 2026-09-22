import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./drizzle/migrations",
	schema: "./drizzle/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		// Introspection reads the catalog, which the fail-closed `app_rls` login
		// cannot do after M08; prefer the admin connection when it is set.
		url: (process.env.DB_ADMIN_CONNECTION_STRING ??
			process.env.DB_CONNECTION_STRING)!,
	},
});
