<script setup lang="ts">
import type { InventoryBatch } from 'src/stores/InventoryStore';

const props = defineProps<{ item: InventoryBatch }>();

function borderColor() {
  if (props.item.requires_manual_expiry) return 'border-l-amber-400';
  if (props.item.is_valid === null) return 'border-l-gray-400';
  return props.item.is_valid ? 'border-l-green-500' : 'border-l-red-500';
}

function badgeBg() {
  if (props.item.requires_manual_expiry) return 'bg-amber-100 text-amber-700';
  if (props.item.is_valid === null) return 'bg-gray-100 text-gray-600';
  return props.item.is_valid
    ? 'bg-green-100 text-green-700'
    : 'bg-red-100 text-red-700';
}

function badgeLabel() {
  if (props.item.requires_manual_expiry) return 'Manual Check';
  if (props.item.is_valid === null) return 'No Expiry Set';
  if (!props.item.is_valid) return 'Expired';
  return `${props.item.days_remaining}d left`;
}

function badgeDot() {
  if (props.item.requires_manual_expiry) return 'bg-amber-400';
  if (props.item.is_valid === null) return 'bg-gray-400';
  return props.item.is_valid ? 'bg-green-500' : 'bg-red-500';
}
</script>

<template>
  <div
    :class="[
      'bg-white rounded-2xl border-l-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 overflow-hidden',
      borderColor()
    ]"
  >
    <div class="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
      <div>
        <p class="text-xs text-gray-400 uppercase tracking-widest font-medium">Batch</p>
        <p class="font-mono text-sm text-gray-700 mt-0.5">{{ item.inventory_items?.name}}...</p>
      </div>
      <span :class="['inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', badgeBg()]">
        <span :class="['w-1.5 h-1.5 rounded-full', badgeDot()]" />
        {{ badgeLabel() }}
      </span>
    </div>

    <div class="h-px bg-gray-100 mx-4" />
    <div class="px-4 py-3 space-y-2.5">
      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-400 flex items-center gap-1.5">
          <span class="material-icons text-sm">key</span>
          Item ID
        </span>
        <span class="text-sm font-semibold text-gray-800">
          <span class="text-gray-400 font-normal">{{ item.batch_id }}</span>
        </span>
      </div>
    </div>
    <div class="px-4 py-3 space-y-2.5">
      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-400 flex items-center gap-1.5">
          <span class="material-icons text-sm">inventory_2</span>
          Qty Remaining
        </span>
        <span class="text-sm font-semibold text-gray-800">
          {{ item.qty_remaining }}
          <span class="text-gray-400 font-normal">{{ item.qty_received }}</span>
        </span>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-400 flex items-center gap-1.5">
          <span class="material-icons text-sm">payments</span>
          Unit Cost
        </span>
        <span class="text-sm font-semibold text-gray-800">${{ item.unit_cost.toFixed(2) }}</span>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-400 flex items-center gap-1.5">
          <span class="material-icons text-sm">event</span>
          Expiry Date
        </span>
        <span class="text-sm font-semibold text-gray-800">{{ item.expiration_date ?? '—' }}</span>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-400 flex items-center gap-1.5">
          <span class="material-icons text-sm">source</span>
          Source
        </span>
        <span class="text-sm font-semibold text-gray-800">{{ item.expiration_source ?? '—' }}</span>
      </div>
    </div>

    <!-- Expired Footer Banner -->
    <div
      v-if="item.is_valid === false && !item.requires_manual_expiry"
      class="mx-4 mb-4 mt-1 bg-red-50 border border-red-100 rounded-xl px-3 py-2 flex items-center gap-2"
    >
      <span class="material-icons text-red-400 text-sm">warning</span>
      <span class="text-xs text-red-500 font-medium">This batch has expired</span>
    </div>

    <!-- Manual Check Footer Banner -->
    <div
      v-else-if="item.requires_manual_expiry"
      class="mx-4 mb-4 mt-1 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex items-center gap-2"
    >
      <span class="material-icons text-amber-400 text-sm">edit_calendar</span>
      <span class="text-xs text-amber-600 font-medium">Requires manual expiry check</span>
    </div>

    <div v-else class="mb-4" />
  </div>
</template>