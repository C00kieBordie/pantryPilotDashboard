import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('src/pages/LogIn.vue'),
    children: [
      { 
        path: '', 
        component: () => import('src/pages/IndexPage.vue') 
      },
      { 
        path: 'login', 
        component: () => import('src/layouts/MainLayout.vue'),
      },
      { 
        path: 'profile', 
        component: () => import('src/pages/UserProfile.vue'),
        meta: {requiresAuth: true},
      },
      { 
        path: 'contact', 
        component: () => import('src/pages/ContactUs.vue') 
      },
    ]
  },
  {
    path: '/admin',
    component: () => import('src/layouts/AdminLayout.vue'),
    meta: {requiresAuth: true, role: 'admin'},
    children: [
      { 
        path: '', 
        component: () => import('src/pages/admin/DashboardLayout.vue') ,
      },
      { 
        path: 'manage_inventory', 
        component: () => import('src/pages/admin/InventoryManagement.vue'),
      },

    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
