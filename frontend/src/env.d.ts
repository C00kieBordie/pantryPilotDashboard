declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
    readonly VITE_GLOBAL_SUPABASE_URL: string
    readonly VITE_GLOBAL_SUPABASE_ANON_KEY: string
    readonly VITE_TENANT_SUPABASE_URL: string
    readonly VITE_TENANT_SUPABASE_ANON_KEY: string
  }
  interface ImportMeta {
  readonly env: ImportMetaEnv
  }
}
