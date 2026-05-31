<script setup lang="ts">
    import { onMounted, computed, ref } from 'vue';
    import { useActivityLogStore } from 'src/stores/ActivityLogsStore';

    const store = useActivityLogStore();
    const search = ref('');

    onMounted(() => store.fetchLogs());

    // Map action types to colors and icons
    const actionMeta: Record<string, { bg: string; text: string; icon: string; label: string }> = {
    added:        { bg: 'bg-green-100',  text: 'text-green-700',  icon: 'add_circle',     label: 'Added'        },
    removed:      { bg: 'bg-red-100',    text: 'text-red-700',    icon: 'remove_circle',  label: 'Removed'      },
    updated:      { bg: 'bg-blue-100',   text: 'text-blue-700',   icon: 'edit',           label: 'Updated'      },
    expired:      { bg: 'bg-orange-100', text: 'text-orange-700', icon: 'schedule',       label: 'Expired'      },
    scanned:      { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'qr_code_scanner',label: 'Scanned'      },
    expiry_set:   { bg: 'bg-teal-100',   text: 'text-teal-700',   icon: 'event_available',label: 'Expiry Set'   },
    };

    function getMeta(action: string) {
    return actionMeta[action] ?? { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'info', label: action };
    }

    function formatDate(ts: string) {
    const d = new Date(ts);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        + ' · '
        + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }

    const filteredLogs = computed(() => {
    if (!search.value.trim()) return store.logs;
    const q = search.value.toLowerCase();
    return store.logs.filter(log =>
        log.inventory_batches?.inventory_items?.name?.toLowerCase().includes(q) ||
        log.users?.username?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q)
    );
    });
</script>

<template>
  <q-page class="min-h-screen px-6 py-6">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white tracking-tight">Activity Log</h1>
        <p class="text-sm text-white/60 mt-0.5">{{ store.logs.length }} recent actions</p>
      </div>
      <button
        @click="store.fetchLogs()"
        :disabled="store.loading"
        class="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-50"
      >
        <span :class="['material-icons text-sm', store.loading ? 'animate-spin' : '']">refresh</span>
        Refresh
      </button>
    </div>

    <!-- Search -->
    <div class="relative mb-5">
      <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">search</span>
      <input
        v-model="search"
        type="text"
        placeholder="Search by item, user or action..."
        class="w-full bg-white/10 text-white placeholder-white/40 text-sm pl-9 pr-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30 transition-all"
      />
      <button v-if="search" @click="search = ''" class="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
        <span class="material-icons text-sm">close</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex flex-col items-center justify-center gap-4 py-24">
      <div class="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      <p class="text-white/70 text-sm">Loading activity log...</p>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="flex flex-col items-center justify-center gap-3 py-24">
      <span class="material-icons text-red-300 text-5xl">error_outline</span>
      <p class="text-white/70 text-sm">{{ store.error }}</p>
      <button @click="store.fetchLogs()" class="text-sm text-white underline underline-offset-2">Try again</button>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredLogs.length === 0" class="flex flex-col items-center justify-center gap-3 py-24">
      <span class="material-icons text-white/40 text-5xl">history</span>
      <p class="text-white/60 text-sm">No activity found</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-2xl overflow-hidden shadow-sm">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-gray-50 border-b border-gray-100">
            <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Action</th>
            <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Item</th>
            <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Batch ID</th>
            <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">User</th>
            <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(log, i) in filteredLogs"
            :key="log.log_id"
            :class="['border-b border-gray-50 hover:bg-gray-50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50']"
          >
            <!-- Action badge -->
            <td class="px-5 py-3.5">
              <span :class="['inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', getMeta(log.action).bg, getMeta(log.action).text]">
                <span class="material-icons text-xs">{{ getMeta(log.action).icon }}</span>
                {{ getMeta(log.action).label }}
              </span>
            </td>

            <!-- Item name -->
            <td class="px-5 py-3.5 font-medium text-gray-800">
              {{ log.inventory_batches?.inventory_items?.name ?? '—' }}
            </td>

            <!-- Batch ID -->
            <td class="px-5 py-3.5 font-mono text-xs text-gray-400">
              {{ log.inventory_batches?.batch_id?.slice(0, 8) ?? '—' }}...
            </td>

            <!-- User -->
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-[#629FAD]/20 flex items-center justify-center text-[#629FAD] text-xs font-bold uppercase">
                  {{ log.users?.username?.charAt(0) ?? '?' }}
                </div>
                <span class="text-gray-600">{{ log.users?.username ?? 'Unknown' }}</span>
              </div>
            </td>
            <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Changes</th>

            <!-- Add this column cell inside the v-for row -->
            <td class="px-5 py-3.5 text-xs text-gray-500 font-mono">
              {{ log.details ?? '—' }}
            </td>

            <!-- Timestamp -->
            <td class="px-5 py-3.5 text-gray-400 text-xs">
              {{ formatDate(log.logged_at) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </q-page>
</template>