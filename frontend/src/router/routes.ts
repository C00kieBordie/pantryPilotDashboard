import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('src/layouts/BlankLayout.vue'),
    children: [
      { 
        path: '', 
        component: () => import('src/pages/LoginPage.vue') 
      },
    ]
  },
  {
    path: '/admin',
    component: () => import('layouts/AdminLayout.vue'), 
    meta: { requiresAuth: true },
    children: [
      { path: '/admin/', component: () => import('pages/AdminDashboard.vue') },
      { path: 'InventoryManagement', component: () => import('pages/InventoryManagement.vue') },
      { path: 'ActivityLog', component: () => import('pages/ActivityLog.vue') },
      { path: 'UserCenter', component: () => import('pages/UserCenter.vue') },
      { path: 'FinancialAlert', component: () => import('pages/FinancialAlerts.vue') },

    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
