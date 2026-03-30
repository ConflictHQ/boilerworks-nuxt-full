import { createConfigForNuxt } from "@nuxt/eslint-config/flat";

export default createConfigForNuxt({}).append({
  rules: {
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unsafe-function-type": "warn",
    "@typescript-eslint/consistent-type-imports": "off",
    "import/first": "off",
  },
});
