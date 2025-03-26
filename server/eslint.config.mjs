import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
	{ files: ["**/*.{js,mjs,cjs,ts}"] },
	{ languageOptions: { globals: globals.browser } },
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ["**/*.{ts}"],
		plugins: ["@typescript-eslint", "import"],
		parser: "@typescript-eslint/parser",
		settings: {
			"import/internal-regex": "^~/",
			"import/resolver": {
				node: {
					extensions: [".ts"],
				},
				typescript: {
					alwaysTryTypes: true,
				},
			},
		},
		extends: [
			"plugin:@typescript-eslint/recommended",
			"plugin:@typescript-eslint/stylistic",
			"plugin:import/recommended",
			"plugin:import/typescript",
			"prettier",
		],
		rules: {
			"no-console": ["error", { allow: ["warn", "error"] }],
			"no-var": "error",
			semi: "error",
			indent: ["error", 2, { SwitchCase: 1 }],
			"no-multi-spaces": "error",
			"space-in-parens": "error",
			"no-multiple-empty-lines": "error",
			"prefer-const": "error",
			"function-paren-newline": ["error", "never"],
			"import/order": [
				"error",
				{
					alphabetize: { caseInsensitive: true, order: "asc" },
					groups: ["builtin", "external", "internal", "parent", "sibling"],
					"newlines-between": "always",
				},
			],
		},
	},
];
