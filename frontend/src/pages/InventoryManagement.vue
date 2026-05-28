<script setup lang="ts">
  import { onMounted, computed, ref } from 'vue';
  import { useInventoryStore } from 'src/stores/InventoryStore';
  import InventoryItemCard from 'components/InventoryItemCard.vue';

  const store = useInventoryStore();
  let result = store.items;

  type FilterKey = 'all' | 'valid' | 'expired' | 'manual';
  const filter = ref<FilterKey>('all');
  const search = ref('');
  onMounted(() => store.fetchItems());
  const filteredItems = computed(() => {
    let result = store.items;

    // Apply tab filter
    switch (filter.value) {
      case 'valid':   result = result.filter(i => i.is_valid === true); break;
      case 'expired': result = result.filter(i => i.is_valid === false); break;
      case 'manual':  result = result.filter(i => i.requires_manual_expiry); break;
    }

    // Apply search filter
    if (search.value.trim()) {
      const q = search.value.toLowerCase();
      result = result.filter(i =>
        i.inventory_items?.name?.toLowerCase().includes(q)
      );
    }

    return result;
  });
  const counts = computed(() => ({
    all:     store.items.length,
    valid:   store.items.filter(i => i.is_valid === true).length,
    expired: store.items.filter(i => i.is_valid === false).length,
    manual:  store.items.filter(i => i.requires_manual_expiry).length,
  }));

  const filters: { key: FilterKey; label: string; activeClass: string }[] = [
    { key: 'all',     label: 'All',     activeClass: 'bg-white text-[#629FAD] shadow-sm' },
    { key: 'valid',   label: 'Valid',   activeClass: 'bg-green-500 text-white shadow-sm' },
    { key: 'expired', label: 'Expired', activeClass: 'bg-red-500 text-white shadow-sm' },
    { key: 'manual',  label: 'Manual',  activeClass: 'bg-amber-400 text-white shadow-sm' },
  ];
</script>

<template>
  <q-page class="min-h-screen px-6 py-6">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white tracking-tight">Inventory Batches</h1>
        <p class="text-sm text-white/60 mt-0.5">{{ store.items.length }} total batches tracked</p>
      </div>
      <button
        @click="store.fetchItems()"
        :disabled="store.loading"
        class="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all duration-150 disabled:opacity-50"
      >
        <span :class="['material-icons text-sm', store.loading ? 'animate-spin' : '']">refresh</span>
        Refresh
      </button>
    </div>

    <!-- Summary Pills -->
    <div class="flex flex-wrap gap-3 mb-6">
      <div class="bg-white/10 rounded-xl px-4 py-2 text-center">
        <p class="text-xs text-white/60">Total</p>
        <p class="text-lg font-bold text-white">{{ counts.all }}</p>
      </div>
      <div class="bg-green-500/20 rounded-xl px-4 py-2 text-center">
        <p class="text-xs text-green-200">Valid</p>
        <p class="text-lg font-bold text-green-300">{{ counts.valid }}</p>
      </div>
      <div class="bg-red-500/20 rounded-xl px-4 py-2 text-center">
        <p class="text-xs text-red-200">Expired</p>
        <p class="text-lg font-bold text-red-300">{{ counts.expired }}</p>
      </div>
      <div class="bg-amber-400/20 rounded-xl px-4 py-2 text-center">
        <p class="text-xs text-amber-200">Manual</p>
        <p class="text-lg font-bold text-amber-300">{{ counts.manual }}</p>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="flex gap-2 flex-wrap mb-6 bg-white/10 p-1 rounded-2xl w-fit">
      <button
        v-for="f in filters"
        :key="f.key"
        @click="filter = f.key"
        :class="[
          'px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-150',
          filter === f.key ? f.activeClass : 'text-white/70 hover:text-white'
        ]"
      >
        {{ f.label }} ({{ counts[f.key] }})
      </button>
    </div>
    <div class="relative mb-4">
          <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">search</span>
          <input
            v-model="search"
            type="text"
            placeholder="Search by item name..."
            class="w-full bg-white/10 text-white placeholder-white/40 text-sm pl-9 pr-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30 transition-all"
          />
          <button
            v-if="search"
            @click="search = ''"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
          >
            <span class="material-icons text-sm">close</span>
          </button>
    </div>
    <!-- Loading -->
    <div v-if="store.loading" class="flex flex-col items-center justify-center gap-4 py-24">
      <div class="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      <p class="text-white/70 text-sm">Loading inventory...</p>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="flex flex-col items-center justify-center gap-3 py-24">
      <span class="material-icons text-red-300 text-5xl">error_outline</span>
      <p class="text-white/70 text-sm">{{ store.error }}</p>
      <button
        @click="store.fetchItems()"
        class="text-sm text-white underline underline-offset-2 hover:text-white/80"
      >
        Try again
      </button>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredItems.length === 0" class="flex flex-col items-center justify-center gap-3 py-24">
      <span class="material-icons text-white/40 text-5xl">inventory</span>
      <p class="text-white/60 text-sm">No items match this filter</p>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <InventoryItemCard
        v-for="item in filteredItems"
        :key="item.batch_id"
        :item="item"
      />
    </div>

  </q-page>
</template>