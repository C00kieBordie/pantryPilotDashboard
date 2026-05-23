import { boot } from 'quasar/wrappers';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const globalUrl = import.meta.env.VITE_GLOBAL_SUPABASE_URL;
const globalKey = import.meta.env.VITE_GLOBAL_SUPABASE_ANON_KEY;

const tenantUrl = import.meta.env.VITE_TENANT_SUPABASE_URL;
const tenantKey = import.meta.env.VITE_TENANT_SUPABASE_ANON_KEY;

export const globalSupabase: SupabaseClient = createClient(globalUrl, globalKey);
export const tenantSupabase: SupabaseClient = createClient(tenantUrl, tenantKey);

export default boot(({ app }) => {
  app.config.globalProperties.$globalSupabase = globalSupabase;
  app.config.globalProperties.$tenantSupabase = tenantSupabase;
});

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $globalSupabase: SupabaseClient;
    $tenantSupabase: SupabaseClient;
  }
}