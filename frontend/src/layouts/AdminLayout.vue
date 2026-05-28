<script setup lang="ts">
import { ref } from 'vue';
import EssentialLink, { type EssentialLinkProps } from 'components/EssentialLink.vue';
import { useAuthStore } from 'src/stores/auth-store';
import {useQuasar} from 'quasar';

const authStore = useAuthStore();

const $q = useQuasar();
const linksList: EssentialLinkProps[] = [
  
  {
    title: 'Manage Inventory',
    icon: 'receipt_long',
    link: '/admin/InventoryManagement',
  },
  {
    title: 'Activities Logs',
    icon: 'history',
    link: '/admin/ActivityLog',
  },
  {
    title: 'User Center',
    icon: 'person',
    link: '/admin/UserCenter',
  },
  {
    title: 'Dashboard',
    icon: 'public',
    link: '/admin/check_dashboard',
  },
];

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
function logout(){
  authStore.logout();
  $q.cookies.remove('librarySession');
  $q.cookies.remove('userProfile');

  window.location.href = '/login';  
  $q.notify({
    message: 'Logged out successfully',
    color: 'info'
  });
}
</script>


<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-toolbar-title> Pantry Pilot </q-toolbar-title>
        <q-btn flat round dense icon="logout" v-if="authStore.token" @click="logout"/>
        
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-[#EDEDCE] text-black">
      <q-list>
        <q-item-label header> Essential Links </q-item-label>

        <EssentialLink v-for="link in linksList" :key="link.title" v-bind="link" />
      </q-list>
    </q-drawer>

    <q-page-container class="bg-[#629FAD]">
      <router-view />
    </q-page-container>
    <footer></footer>
  </q-layout>
</template>
