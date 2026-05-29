<script setup lang="ts">
import { ref } from 'vue';
import type { InventoryBatch } from 'src/stores/InventoryStore';
import { useInventoryStore } from 'src/stores/InventoryStore';
import { useAuthStore } from 'src/stores/auth-store';

const props     = defineProps<{ item: InventoryBatch }>();
const store     = useInventoryStore();
const authStore = useAuthStore();

const deleting  = ref(false);
const showEdit  = ref(false);
const saving    = ref(false);
const deleteErr = ref<string | null>(null);
const saveErr   = ref<string | null>(null);

const editForm = ref({
  qty_remaining:   props.item.qty_remaining,
  unit_cost:       props.item.unit_cost,
  expiration_date: props.item.expiration_date ?? '',
});

function openEdit() {
  editForm.value = {
    qty_remaining:   props.item.qty_remaining,
    unit_cost:       props.item.unit_cost,
    expiration_date: props.item.expiration_date ?? '',
  };
  saveErr.value = null;
  showEdit.value = true;
}

async function confirmDelete() {
  deleting.value = true;
  deleteErr.value = null;
  try {
    await store.deleteBatch(props.item.batch_id);
  } catch {
    deleteErr.value = 'Failed to mark as consumed. Try again.';
  } finally {
    deleting.value = false;
  }
}

async function saveEdit() {
  saving.value = true;
  saveErr.value = null;
  try {
    await store.updateBatch(props.item.batch_id, {
      qty_remaining:   editForm.value.qty_remaining,
      unit_cost:       editForm.value.unit_cost,
      expiration_date: editForm.value.expiration_date || null,
      user_id: authStore.user?.id ? String(authStore.user.id) : null});
      showEdit.value = false;
  } catch {
    saveErr.value = 'Failed to save. Try again.';
  } finally {
    saving.value = false;
  }
}

function borderColor() {
  if (props.item.requires_manual_expiry) return 'border-l-amber-400';
  if (props.item.is_valid === null) return 'border-l-gray-400';
  return props.item.is_valid ? 'border-l-green-500' : 'border-l-red-500';
}

function badgeBg() {
  if (props.item.requires_manual_expiry) return 'bg-amber-100 text-amber-700';
  if (props.item.is_valid === null) return 'bg-gray-100 text-gray-600';
  return props.item.is_valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
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
  <div>
    <!-- Card -->
    <div :class="['bg-white rounded-2xl border-l-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 overflow-hidden', borderColor()]">

      <!-- Header -->
      <div class="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div>
          <p class="text-xs text-gray-400 uppercase tracking-widest font-medium">Batch</p>
          <p class="font-mono text-sm text-gray-700 mt-0.5">{{ item.inventory_items?.name }}</p>
        </div>
        <span :class="['inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', badgeBg()]">
          <span :class="['w-1.5 h-1.5 rounded-full', badgeDot()]" />
          {{ badgeLabel() }}
        </span>
      </div>

      <div class="h-px bg-gray-100 mx-4" />

      <!-- Body -->
      <div class="px-4 py-3 space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400 flex items-center gap-1.5">
            <span class="material-icons text-sm">key</span>Batch ID
          </span>
          <span class="font-mono text-xs text-gray-400">{{ item.batch_id.slice(0, 8) }}...</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400 flex items-center gap-1.5">
            <span class="material-icons text-sm">inventory_2</span>Qty Remaining
          </span>
          <span class="text-sm font-semibold text-gray-800">
            {{ item.qty_remaining }}<span class="text-gray-400 font-normal"> / {{ item.qty_received }}</span>
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400 flex items-center gap-1.5">
            <span class="material-icons text-sm">payments</span>Unit Cost
          </span>
          <span class="text-sm font-semibold text-gray-800">${{ item.unit_cost.toFixed(2) }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400 flex items-center gap-1.5">
            <span class="material-icons text-sm">event</span>Expiry Date
          </span>
          <span class="text-sm font-semibold text-gray-800">{{ item.expiration_date ?? '—' }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400 flex items-center gap-1.5">
            <span class="material-icons text-sm">source</span>Source
          </span>
          <span class="text-sm font-semibold text-gray-800">{{ item.expiration_source ?? '—' }}</span>
        </div>
      </div>

      <!-- Banners -->
      <div v-if="item.is_valid === false && !item.requires_manual_expiry"
        class="mx-4 mt-1 bg-red-50 border border-red-100 rounded-xl px-3 py-2 flex items-center gap-2">
        <span class="material-icons text-red-400 text-sm">warning</span>
        <span class="text-xs text-red-500 font-medium">This batch has expired</span>
      </div>
      <div v-else-if="item.requires_manual_expiry"
        class="mx-4 mt-1 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex items-center gap-2">
        <span class="material-icons text-amber-400 text-sm">edit_calendar</span>
        <span class="text-xs text-amber-600 font-medium">Requires manual expiry check</span>
      </div>

      <p v-if="deleteErr" class="text-xs text-red-500 text-center mt-2 px-4">{{ deleteErr }}</p>

      <!-- Action Buttons -->
      <div class="flex gap-2 px-4 py-4">
        <button
          @click="openEdit"
          class="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold py-2 rounded-xl transition-all"
        >
          <span class="material-icons text-sm">edit</span>Edit
        </button>
        <button
          @click="confirmDelete"
          :disabled="deleting"
          class="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold py-2 rounded-xl transition-all disabled:opacity-50"
        >
          <span :class="['material-icons text-sm', deleting ? 'animate-spin' : '']">
            {{ deleting ? 'refresh' : 'archive' }}
          </span>
          {{ deleting ? 'Updating...' : 'Mark Consumed' }}
        </button>
      </div>
    </div>

    <!-- Edit Modal — inside root div, alongside the card -->
    <q-dialog v-model="showEdit">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h3 class="text-base font-bold text-gray-800">Edit Batch</h3>
            <p class="text-xs text-gray-400 mt-0.5">{{ item.inventory_items?.name }}</p>
          </div>
          <button @click="showEdit = false" class="text-gray-400 hover:text-gray-600">
            <span class="material-icons text-sm">close</span>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">Qty Remaining</label>
            <input
              v-model.number="editForm.qty_remaining"
              type="number" min="0"
              class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#629FAD] transition-all"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">Unit Cost ($)</label>
            <input
              v-model.number="editForm.unit_cost"
              type="number" min="0" step="0.01"
              class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#629FAD] transition-all"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">Expiry Date</label>
            <input
              v-model="editForm.expiration_date"
              type="date"
              class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#629FAD] transition-all"
            />
          </div>
        </div>

        <p v-if="saveErr" class="text-xs text-red-500 mt-3">{{ saveErr }}</p>

        <div class="flex gap-3 mt-6">
          <button
            @click="showEdit = false"
            class="flex-1 py-2 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
          >Cancel</button>
          <button
            @click="saveEdit"
            :disabled="saving"
            class="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-[#629FAD] hover:bg-[#4e8a98] transition-all disabled:opacity-50"
          >{{ saving ? 'Saving...' : 'Save Changes' }}</button>
        </div>
      </div>
    </q-dialog>

  </div>
</template>