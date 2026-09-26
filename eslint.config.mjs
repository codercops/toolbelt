import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // React Compiler rules that arrived with eslint-config-next 16. They flag
  // existing code that works today, so they warn for now and get fixed
  // separately from the Next 16 upgrade.
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Cloudflare build output, local wrangler state, generated OG fonts.
    ".open-next/**",
    ".wrangler/**",
    "cloudflare-env.d.ts",
    "generated/**",
  ]),
]);

export default eslintConfig;
