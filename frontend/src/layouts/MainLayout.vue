<script setup lang="ts">
import { ref } from 'vue';
import EssentialLink, { type EssentialLinkProps } from 'components/EssentialLink.vue';
import { useAuthStore } from 'src/stores/auth-store';
import {useQuasar} from 'quasar';

const authStore = useAuthStore();

const $q = useQuasar();
const search = ref('');
const linksList: EssentialLinkProps[] = [
  {
    title: 'Login',
    icon: 'person',
    link: '/',
  },
  {
    title: 'Stock',
    icon: 'public',
    link: '/stock',
  },
  {
    title: 'Settings',
    icon: 'settings',
    link: '/settings',
  },
  {
    title: 'Contact Us',
    icon: 'phone',
    link: '/contact',
  },
];

const leftDrawerOpen = ref(false);
const openSearch = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
function toggleSearch(){
  openSearch.value = !openSearch.value;
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
        <q-toolbar-title :class="{ 'hidden sm:block': openSearch }">Pantry Pilot</q-toolbar-title>
        <q-btn flat round dense icon="logout" v-if="authStore.token" @click="logout" :class="{ 'hidden sm:block': openSearch }"/>
        <q-btn flat dense round icon="search" aria-label="Search" @click="toggleSearch"/>
        <q-input
          filled 
          rounded 
          class="w-full max-w-sm ml-auto" 
          v-if="openSearch" 
          bg-color="white" 
          v-model="search" 
          label="Search for Book..."
          @blur="openSearch = false"
        />
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
