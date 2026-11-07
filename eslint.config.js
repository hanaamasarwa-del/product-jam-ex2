import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", ".wrangler/**", "worker-configuration.d.ts"] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ---------------------------------------------------------------------
  // Build tooling that runs on your own machine with Node, not in the
  // browser and not on Cloudflare.
  // ---------------------------------------------------------------------
  {
    files: ["scripts/**/*.{js,mjs}", "*.config.{js,ts}"],
    languageOptions: { globals: globals.node },
  },

  // ---------------------------------------------------------------------
  // Browser code.
  // ---------------------------------------------------------------------
  {
    files: ["client/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "warn",
    },
  },

  // ---------------------------------------------------------------------
  // Server code. These rules exist to catch the two mistakes people make
  // most often: using browser APIs on the server, and importing packages
  // that Cloudflare Workers cannot run.
  // ---------------------------------------------------------------------
  {
    files: ["server/**/*.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "document",
          message:
            "There is no browser here. This code runs on Cloudflare Workers.",
        },
        {
          name: "window",
          message:
            "There is no browser here. This code runs on Cloudflare Workers.",
        },
        {
          name: "localStorage",
          message:
            "There is no browser here. This code runs on Cloudflare Workers.",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "fs",
                "node:fs",
                "path",
                "node:path",
                "child_process",
                "node:child_process",
              ],
              message:
                'Cloudflare Workers cannot use this. See "The server runs on Cloudflare Workers" in README.md for what works instead.',
            },
            {
              group: ["@/*"],
              message:
                "That is browser code. The server cannot import from client/.",
            },
          ],
        },
      ],
    },
  },

  // ---------------------------------------------------------------------
  // Shared code is imported by BOTH sides, so it may not import either one.
  // ---------------------------------------------------------------------
  {
    files: ["shared/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/*", "../client/*", "../server/*"],
              message:
                "shared/ is imported by both the browser and the server, so it cannot import either.",
            },
          ],
        },
      ],
    },
  },

  { rules: { "@typescript-eslint/no-explicit-any": "error" } },
);
