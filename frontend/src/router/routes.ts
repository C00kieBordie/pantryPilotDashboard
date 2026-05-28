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
      { path: '', component: () => import('pages/AdminDashboard.vue') },
      { path: 'InventoryManagement', component: () => import('pages/InventoryManagement.vue') },
      { path: 'AvtivityLog', component: () => import('pages/ActivityLog.vue') },
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
