import { fileURLToPath } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

/**
 * Integration tests run against a real database (the local Supabase stack in
 * CI, or TEST when explicitly pointed at it), so they are kept out of the unit
 * run and never execute in a browser-like environment.
 */
export default defineConfig({
	plugins: [tsconfigPaths()],
	resolve: {
		alias: {
			"server-only": fileURLToPath(
				new URL("./node_modules/server-only/empty.js", import.meta.url),
			),
		},
	},
	test: {
		environment: "node",
		// The cutover rehearsal rewrites every user in the database, so no two
		// integration files may be in flight at once.
		fileParallelism: false,
		include: ["tests/integration/**/*.test.ts"],
		passWithNoTests: true,
		testTimeout: 30000,
		hookTimeout: 60000,
		clearMocks: true,
		server: { deps: { inline: [/@quicktalog\/common/] } },
	},
});
