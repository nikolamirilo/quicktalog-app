import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./drizzle/migrations",
	schema: "./drizzle/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DB_CONNECTION_STRING!,
	},
});
