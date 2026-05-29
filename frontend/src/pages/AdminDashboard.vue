<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useDashboardStore } from 'src/stores/DashboardStore';

type Range = 'week' | 'month' | 'year';

const store = useDashboardStore();
const range = ref<Range>('month');

onMounted(() => store.fetchStats(range.value));
watch(range, (val) => store.fetchStats(val));

const ranges: Range[] = ['week', 'month', 'year'];

const chartData = computed(() => {
  const groups: Record<string, number> = {};

  store.invoices.forEach(inv => {
    const date = new Date(inv.scanned_at);
    let key: string;

    if (range.value === 'week') {
      key = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
    } else if (range.value === 'year') {
      key = date.toLocaleDateString('en-GB', { month: 'short' });
    } else {
      key = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }

    groups[key] = (groups[key] ?? 0) + parseFloat(inv.total_amount as unknown as string);
  });

  const entries = Object.entries(groups);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return entries.map(([label, value]) => ({ label, value, pct: (value / max) * 100 }));
});

function lostValue(b: { unit_cost: number; qty_remaining: number }) {
  return (parseFloat(b.unit_cost as unknown as string) * b.qty_remaining).toFixed(2);
}

function daysExpired(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
</script>

<template>
  <q-page class="min-h-screen px-6 py-6">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
        <p class="text-sm text-white/60 mt-0.5">Financial overview</p>
      </div>

      <!-- Range toggle -->
      <div class="flex bg-white/10 p-1 rounded-xl gap-1">
        <button
          v-for="r in ranges"
          :key="r"
          @click="range = r"
          :class="[
            'px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize',
            range === r ? 'bg-white text-[#629FAD] shadow-sm' : 'text-white/70 hover:text-white'
          ]"
        >{{ r }}</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex flex-col items-center justify-center gap-4 py-24">
      <div class="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      <p class="text-white/70 text-sm">Loading dashboard...</p>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="flex flex-col items-center justify-center gap-3 py-24">
      <span class="material-icons text-red-300 text-5xl">error_outline</span>
      <p class="text-white/70 text-sm">{{ store.error }}</p>
      <button @click="store.fetchStats(range)" class="text-sm text-white underline">Try again</button>
    </div>

    <template v-else>
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="bg-white rounded-2xl p-5 shadow-sm">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <span class="material-icons text-blue-500 text-lg">receipt_long</span>
            </div>
            <p class="text-sm text-gray-500 font-medium">Total Spent</p>
          </div>
          <p class="text-3xl font-bold text-gray-800">${{ store.totalSpent.toFixed(2) }}</p>
          <p class="text-xs text-gray-400 mt-1">This {{ range }}</p>
        </div>

        <div class="bg-white rounded-2xl p-5 shadow-sm">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <span class="material-icons text-red-400 text-lg">trending_down</span>
            </div>
            <p class="text-sm text-gray-500 font-medium">Lost to Expiry</p>
          </div>
          <p class="text-3xl font-bold text-red-500">${{ store.totalLost.toFixed(2) }}</p>
          <p class="text-xs text-gray-400 mt-1">Still in stock, expired</p>
        </div>
      </div>

      <!-- Chart + Expired panel -->
      <div class="grid grid-cols-3 gap-4">

        <!-- Bar Chart -->
        <div class="col-span-2 bg-white rounded-2xl p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Spending over time</h2>

          <div v-if="chartData.length === 0" class="flex flex-col items-center justify-center py-12 gap-2">
            <span class="material-icons text-gray-300 text-4xl">bar_chart</span>
            <p class="text-sm text-gray-400">No invoices in this period</p>
          </div>

          <div v-else class="flex items-end gap-2 h-48 overflow-x-auto pb-2">
            <div
              v-for="bar in chartData"
              :key="bar.label"
              class="flex flex-col items-center gap-1 flex-1 min-w-[36px]"
            >
              <span class="text-xs text-gray-500 font-medium">${{ bar.value.toFixed(0) }}</span>
              <div class="w-full relative flex items-end" style="height: 140px">
                <div
                  :style="{ height: bar.pct + '%' }"
                  class="w-full bg-[#629FAD] rounded-t-lg transition-all duration-500 hover:bg-[#4e8a98] min-h-[4px]"
                />
              </div>
              <span class="text-xs text-gray-400 text-center leading-tight">{{ bar.label }}</span>
            </div>
          </div>
        </div>

        <!-- Expired Stock Panel -->
        <div class="bg-white rounded-2xl p-5 shadow-sm flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-gray-700">Expired Stock</h2>
            <span class="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
              {{ store.expiredBatches.length }} items
            </span>
          </div>

          <div v-if="store.expiredBatches.length === 0" class="flex flex-col items-center justify-center flex-1 gap-2">
            <span class="material-icons text-green-300 text-4xl">check_circle</span>
            <p class="text-sm text-gray-400">No expired stock!</p>
          </div>

          <div v-else class="flex flex-col gap-2 overflow-y-auto max-h-52">
            <div
              v-for="batch in store.expiredBatches"
              :key="batch.expiration_date + batch.inventory_items?.name"
              class="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5"
            >
              <div class="flex items-center justify-between mb-1">
                <p class="text-sm font-semibold text-gray-800 truncate">
                  {{ batch.inventory_items?.name ?? 'Unknown' }}
                </p>
                <span class="text-xs text-red-500 font-bold ml-2 shrink-0">
                  -${{ lostValue(batch) }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-400">Qty: {{ batch.qty_remaining }}</span>
                <span class="text-xs text-red-400">{{ daysExpired(batch.expiration_date) }}d ago</span>
              </div>
            </div>
          </div>

          <div v-if="store.expiredBatches.length > 0" class="mt-3 pt-3 border-t border-gray-100">
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-500">Total loss</span>
              <span class="text-sm font-bold text-red-500">${{ store.totalLost.toFixed(2) }}</span>
            </div>
          </div>
        </div>

      </div>
    </template>
  </q-page>
</template>