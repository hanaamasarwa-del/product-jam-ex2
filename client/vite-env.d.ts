/// <reference types="vite/client" />

// Describes the VITE_ variables from .env, so TypeScript can check them.
// If you add a variable to .env, add it here too.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SHOW_DEMOS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
