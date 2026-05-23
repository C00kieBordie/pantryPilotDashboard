import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { useAuthStore } from 'src/stores/auth-store';
import { globalSupabase } from 'src/boot/supabase'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    role?: 'Manager' | 'user';
  }
}

export default defineRouter(function ({ store }) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore(store);
    let localToken: string | null = null;
    let localUserRole: string = 'user';
    
    if (!authStore.token) {
      const { data: { session } } = await globalSupabase.auth.getSession();
      if (session) {
        localToken = session.access_token;
        localUserRole = session.user?.user_metadata?.role || 'user'; 
      }
    }
    const isLoggedIn = authStore.token || localToken;
    const userRole = authStore.user?.status || localUserRole;

    console.log('Guard sees Token:', isLoggedIn);
    console.log('Guard sees Status/Role:', userRole);

    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const requiredRole = to.meta.role;

    if (requiresAuth && !isLoggedIn) {
      console.log('Not logged in. Redirecting to login.');
      next({ path: '/login' });
    } else if (requiredRole === 'Manager' && userRole !== 'Manager') {
      console.log('Not a Manager. Forwarded to user mode. Current role:', userRole);
      next({ path: '/' }); 
    } else if (to.path === '/login' && isLoggedIn) {
      next({ path: userRole === 'Manager' ? '/admin' : '/' });
    } else {
      next();
    }
  });

  return Router;
});