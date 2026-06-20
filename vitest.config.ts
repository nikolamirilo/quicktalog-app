import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	// react() transforms JSX itself, so tests work despite the app's
	// `jsx: preserve` tsconfig setting (meant for Next).
	plugins: [tsconfigPaths(), react()],
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
