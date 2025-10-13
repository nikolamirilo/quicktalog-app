import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

const compat = new FlatCompat({
	baseDirectory: import.meta.dirname,
	recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
	...compat.config({
		env: {
			browser: true,
			es2021: true,
			node: true,
		},
		extends: ["next", "eslint:recommended"],
		plugins: ["import"],
		rules: {
			"no-unused-vars": [
				"error",
				{ vars: "all", args: "after-used", ignoreRestSiblings: false },
			],
			"no-console": ["warn", { allow: ["warn", "error"] }],
			"import/order": ["warn", { "newlines-between": "always" }],
		},
		settings: {
			next: {
				rootDir: process.cwd(),
			},
		},
	}),
];

export default eslintConfig;
