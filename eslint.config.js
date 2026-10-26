import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/storybook-static/**", "**/node_modules/**"] },
  ...tseslint.configs.strict,
);
