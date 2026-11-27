import next from "@next/eslint-plugin-next";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default defineConfig([
  ...tseslint.configs.recommended,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "tmp/**"]),
  {
    files: ["{app,components}/**/*.{js,jsx,ts,tsx}"],
    plugins: { "@next/next": next, "react-hooks": reactHooks },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
      ...reactHooks.configs.flat.recommended.rules,
    },
  },
  {
    // These components request images already sized by their media providers.
    files: [
      "app/{gallery,list}/page.tsx",
      "components/{image-crossfade,image-lightbox,weather}.tsx",
    ],
    rules: { "@next/next/no-img-element": "off" },
  },
]);
