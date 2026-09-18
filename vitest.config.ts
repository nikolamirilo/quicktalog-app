import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	// react() transforms JSX itself, so tests work despite the app's
	// `jsx: preserve` tsconfig setting (meant for Next).
	plugins: [tsconfigPaths(), react()],
	resolve: {
		alias: {
			// `server-only` throws outside a React Server Component build; tests import server modules directly.
			"server-only": fileURLToPath(
				new URL("./node_modules/server-only/empty.js", import.meta.url),
			),
		},
	},
	test: {
		// Default to node; DOM-dependent files opt in with
		// `// @vitest-environment happy-dom` at the top of the file.
		environment: "node",
		include: ["tests/unit/**/*.test.{ts,tsx}"],
		clearMocks: true,
		server: {
			// @quicktalog/common ships ESM with directory imports that Node's
			// loader rejects; inlining lets Vite resolve them.
			deps: { inline: [/@quicktalog\/common/] },
		},
	},
});
