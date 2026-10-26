import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/storybook-static/**",
      "**/node_modules/**",
      "**/.next/**",
      "**/next-env.d.ts",
    ],
  },
  ...tseslint.configs.strict,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
  // Build scripts are CommonJS.
  { files: ["**/*.cjs"], rules: { "@typescript-eslint/no-require-imports": "off" } },
  // noUncheckedIndexedAccess makes indexed reads optional; asserting a checked index is allowed.
  { rules: { "@typescript-eslint/no-non-null-assertion": "off" } },
);
