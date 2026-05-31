<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useFinancialAlertStore } from 'src/stores/FinancialAlertStore';
import { useAuthStore } from 'src/stores/auth-store';

const store     = useFinancialAlertStore();
const authStore = useAuthStore();

const loading = computed(() => store.loading);
const error   = computed(() => store.error);
function fetchAlerts() { void store.fetchAlerts(); }

const filter  = ref<'all' | 'unread' | 'read'>('all');
const search  = ref('');
const marking = ref<string | null>(null);

onMounted(() => store.fetchAlerts());

async function markRead(alert_id: string) {
  marking.value = alert_id;
  try {
    await store.markRead(alert_id, authStore.user?.id ? String(authStore.user.id) : null);
  } finally {
    marking.value = null;
  }
}

const filtered = computed(() => {
  let result = store.alerts;
  if (filter.value === 'unread') result = result.filter(a => a.status === 'open');
  if (filter.value === 'read')   result = result.filter(a => a.status === 'resolved');
  if (search.value.trim()) {
    const q = search.value.toLowerCase();
      result = result.filter(a =>
      a.alert_type.toLowerCase().includes(q) ||
      a.batch_id.toLowerCase().includes(q)
    );
  }
  return result;
});

const counts = computed(() => ({
  all:    store.alerts.length,
  unread: store.unreadCount,
  read:   store.readCount,
}));

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function alertTypeColor(type: string) {
  const t = type?.toLowerCase();
  if (t?.includes('expir'))                           return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
  if (t?.includes('cost'))                            return 'text-blue-400  bg-blue-400/10  border-blue-400/20';
  if (t?.includes('stock') || t?.includes('reorder')) return 'text-red-400   bg-red-400/10   border-red-400/20';
  return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
}

function riskColor(val: number) {
  if (val >= 500) return 'text-red-400';
  if (val >= 100) return 'text-amber-400';
  return 'text-green-400';
}
</script>

<template>
  <q-page class="min-h-screen px-6 py-6">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white tracking-tight">Financial Alerts</h1>
        <p class="text-sm text-white/60 mt-0.5">{{ store.unreadCount }} open alerts</p>
      </div>
      <button
        @click="fetchAlerts"
        :disabled="loading"
        class="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-50"
      >
        <span :class="['material-icons text-sm', loading ? 'animate-spin' : '']">refresh</span>
        Refresh
      </button>
    </div>

    <!-- Summary Pills -->
    <div class="flex flex-wrap gap-3 mb-6">
      <div class="bg-white/10 rounded-xl px-4 py-2 text-center">
        <p class="text-xs text-white/60">Total</p>
        <p class="text-lg font-bold text-white">{{ counts.all }}</p>
      </div>
      <div class="bg-red-500/20 rounded-xl px-4 py-2 text-center">
        <p class="text-xs text-red-200">Open</p>
        <p class="text-lg font-bold text-red-300">{{ counts.all - counts.read }}</p>
      </div>
      <div class="bg-green-500/20 rounded-xl px-4 py-2 text-center">
        <p class="text-xs text-green-200">Resolved</p>
        <p class="text-lg font-bold text-green-300">{{ counts.read }}</p>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="flex gap-2 mb-4 bg-white/10 p-1 rounded-2xl w-fit">
      <button
        v-for="f in ([
          { key: 'all',    label: 'All',      active: 'bg-white text-[#629FAD] shadow-sm' },
          { key: 'unread', label: 'Open',     active: 'bg-red-500 text-white shadow-sm'   },
          { key: 'read',   label: 'Resolved', active: 'bg-green-500 text-white shadow-sm' },
        ] as const)"
        :key="f.key"
        @click="filter = f.key"
        :class="[
          'px-4 py-1.5 rounded-xl text-sm font-medium transition-all',
          filter === f.key ? f.active : 'text-white/70 hover:text-white'
        ]"
      >
        {{ f.label }} ({{ counts[f.key] }})
      </button>
    </div>

    <!-- Search -->
    <div class="relative mb-6">
      <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">search</span>
      <input
        v-model="search"
        type="text"
        placeholder="Search by item name or type..."
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
    <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-24">
      <div class="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      <p class="text-white/70 text-sm">Loading alerts...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-col items-center justify-center gap-3 py-24">
      <span class="material-icons text-red-300 text-5xl">error_outline</span>
      <p class="text-white/70 text-sm">{{ error }}</p>
      <button @click="fetchAlerts" class="text-sm text-white underline hover:text-white/80">Try again</button>
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="flex flex-col items-center justify-center gap-3 py-24">
      <span class="material-icons text-white/40 text-5xl">notifications_off</span>
      <p class="text-white/60 text-sm">No alerts match this filter</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white/5 rounded-2xl overflow-hidden border border-white/10">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
              <th class="text-left px-4 py-3 font-medium">Type</th>
              <th class="text-left px-4 py-3 font-medium">Item</th>
              <th class="text-right px-4 py-3 font-medium">Risk Value</th>
              <th class="text-left px-4 py-3 font-medium">Triggered</th>
              <th class="text-left px-4 py-3 font-medium">Status</th>
              <th class="text-left px-4 py-3 font-medium">Date Resolved</th>
              <th class="text-center px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="alert in filtered"
              :key="alert.alert_id"
              :class="[
                'border-b border-white/5 transition-colors',
                alert.status === 'open' ? 'bg-white/5 hover:bg-white/10' : 'hover:bg-white/5'
              ]"
            >
              <!-- Type -->
              <td class="px-4 py-3">
                <span :class="['inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border', alertTypeColor(alert.alert_type)]">
                  {{ alert.alert_type }}
                </span>
              </td>

              <!-- Item -->
              <td class="px-4 py-3">
                <span class="text-sm text-white/80 font-medium">{{ alert.batch_id ?? '—' }}</span>
              </td>

              <!-- Risk Value -->
              <td class="px-4 py-3 text-right">
                <span :class="['font-bold', riskColor(alert.monetary_risk_value)]">
                  ${{ alert.monetary_risk_value.toFixed(2) }}
                </span>
              </td>

              <!-- Triggered At -->
              <td class="px-4 py-3 text-white/60 text-xs">{{ formatDate(alert.triggered_at) }}</td>

              <!-- Status -->
              <td class="px-4 py-3">
                <span :class="[
                  'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
                  alert.status === 'resolved' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                ]">
                  <span :class="['w-1.5 h-1.5 rounded-full', alert.status === 'resolved' ? 'bg-green-400' : 'bg-red-400']" />
                  {{ alert.status === 'resolved' ? 'Resolved' : 'Open' }}
                </span>
              </td>

              <!-- Date Resolved -->
              <td class="px-4 py-3 text-white/60 text-xs">{{ formatDate(alert.date_read) }}</td>

              <!-- Action -->
              <td class="px-4 py-3 text-center">
                <button
                  v-if="alert.status === 'open'"
                  @click="markRead(alert.alert_id)"
                  :disabled="marking === alert.alert_id"
                  class="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                >
                  <span :class="['material-icons text-xs', marking === alert.alert_id ? 'animate-spin' : '']">
                    {{ marking === alert.alert_id ? 'refresh' : 'done' }}
                  </span>
                  {{ marking === alert.alert_id ? '...' : 'Mark Resolved' }}
                </button>
                <span v-else class="text-white/20 text-xs">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </q-page>
</template>