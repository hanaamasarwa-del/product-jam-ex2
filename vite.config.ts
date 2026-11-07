import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

/**
 * Gives the deployed server its SUPABASE_URL, copied from VITE_SUPABASE_URL.
 *
 * The Cloudflare plugin writes dist/server/wrangler.json during the build;
 * `npm run deploy` then hands that file to wrangler. We add one variable to
 * it on the way past, so the URL is typed once - in .env - instead of again
 * in wrangler.jsonc and again in the Cloudflare dashboard.
 *
 * Only the VITE_ half of .env is read here, so SUPABASE_SECRET_KEY cannot
 * end up in this file by accident. Secrets are never build-time values.
 */
function serverUrlFromEnv(supabaseUrl: string): Plugin {
  return {
    name: "server-url-from-env",
    apply: "build",
    closeBundle() {
      // `vite build` runs twice - once for the browser, once for the server.
      // Only the server half has a wrangler.json to add anything to.
      if (this.environment.name !== "server") return;

      const configPath = fileURLToPath(
        new URL("./dist/server/wrangler.json", import.meta.url),
      );
      if (!existsSync(configPath)) return;

      // Without this guard, building on a machine with no .env would hand
      // wrangler an empty value and wipe the URL off the deployed Worker.
      if (!supabaseUrl) {
        console.warn(
          "\nVITE_SUPABASE_URL is empty, so the built server has no " +
            "SUPABASE_URL.\nFill it in .env before deploying - see " +
            "docs/04-deploy.md.\n",
        );
        return;
      }

      const config = JSON.parse(readFileSync(configPath, "utf8"));
      config.vars = { ...config.vars, SUPABASE_URL: supabaseUrl };
      writeFileSync(configPath, JSON.stringify(config, null, 2));
    },
  };
}

export default defineConfig(({ mode }) => {
  // "VITE_" means only the public half of .env is read. The secret key is not
  // loaded into the build at all.
  const env = loadEnv(
    mode,
    fileURLToPath(new URL(".", import.meta.url)),
    "VITE_",
  );

  return {
    plugins: [
      react(),
      // Runs server/index.ts inside the real Cloudflare runtime during `vite dev`,
      // so local development behaves the same as production.
      //
      // configPath is needed because the browser app lives in client/ (see `root`
      // below), and the plugin otherwise looks for wrangler.jsonc there instead of
      // here. Without it you get a silent fallback: no server at all.
      cloudflare({
        configPath: fileURLToPath(new URL("./wrangler.jsonc", import.meta.url)),
        // Builds the server into dist/server/ instead of a folder named after
        // your app, so `npm run deploy` can find it without knowing the name.
        viteEnvironment: { name: "server" },
      }),
      serverUrlFromEnv(env.VITE_SUPABASE_URL ?? ""),
    ],

    // The browser app lives in client/. That folder is the Vite "root", so
    // client/index.html is the page that gets served.
    root: "client",

    // ...but .env lives at the top of the repo, next to package.json.
    envDir: "..",

    build: {
      // The plugin adds its own subfolder per environment, so this produces
      // dist/client/ (the browser files) and dist/server/ (the server).
      outDir: "../dist",
      emptyOutDir: true,
    },

    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./client", import.meta.url)),
        "@shared": fileURLToPath(new URL("./shared", import.meta.url)),
      },
    },

    server: {
      port: 3000,
      strictPort: true,
    },
  };
});
