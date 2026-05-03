import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { useAuthStore } from 'src/stores/auth-store';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    role?: 'admin' | 'user';
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

  Router.beforeEach((to, from, next) => {
    const authStore = useAuthStore(store); 
    console.log('Guard sees Token:', authStore.token);
  console.log('Guard sees Status:', authStore.user?.status);
    const isLoggedIn = authStore.token;
    const userRole = authStore.user?.status || authStore.token;

    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const requiredRole = to.meta.role;

    if (requiresAuth && !isLoggedIn) {
      next({ path: '/login' });
    } else if (requiredRole === 'admin' && userRole !== 'admin') {
      next({ path: '/' }); 
      console.log('forwarded to user mode');
      console.log(userRole);
    } else {
      next();
    }
  });

  return Router;
});