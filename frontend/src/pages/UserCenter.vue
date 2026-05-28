<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from 'src/stores/UserStore';

const store = useUserStore();
onMounted(() => store.fetchUsers());

// Create user form
const showCreate  = ref(false);
const createErr   = ref<string | null>(null);
const creating    = ref(false);
const createForm  = ref({ username: '', pin: '', role: 'staff' }); // ← password → pin

// Change PIN
const showPassword     = ref(false);
const passwordErr      = ref<string | null>(null);
const savingPassword   = ref(false);
const selectedUser     = ref<string | null>(null);
const selectedUsername = ref('');
const newPassword      = ref('');
const confirmPassword  = ref('');

function openPasswordModal(user_id: string, username: string) {
  selectedUser.value     = user_id;
  selectedUsername.value = username;
  newPassword.value      = '';
  confirmPassword.value  = '';
  passwordErr.value      = null;
  showPassword.value     = true;
}

async function submitCreate() {
  creating.value = true;
  createErr.value = null;
  try {
    await store.createUser(createForm.value); // now has pin instead of password
    showCreate.value = false;
    createForm.value = { username: '', pin: '', role: 'staff' }; // ← reset with pin
  } catch (err: unknown) {
    createErr.value = err instanceof Error ? err.message : 'Failed to create user';
  } finally {
    creating.value = false;
  }
}

async function submitPassword() {
  if (newPassword.value !== confirmPassword.value) {
    passwordErr.value = 'PINs do not match.';
    return;
  }
  if (newPassword.value.length < 4) {
    passwordErr.value = 'PIN must be at least 4 digits.'; // ← 6 chars → 4 digits
    return;
  }
  savingPassword.value = true;
  passwordErr.value = null;
  try {
    await store.changePin(selectedUser.value!, newPassword.value); // ← changePassword → changePin
    showPassword.value = false;
  } catch (err: unknown) {
    passwordErr.value = err instanceof Error ? err.message : 'Failed to change PIN';
  } finally {
    savingPassword.value = false;
  }
}

function roleBadge(role: string) {
  if (role === 'manager') return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 text-gray-600';
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}
</script>

<template>
  <q-page class="min-h-screen px-6 py-6">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white tracking-tight">User Management</h1>
        <p class="text-sm text-white/60 mt-0.5">{{ store.users.length }} registered users</p>
      </div>
      <button
        @click="showCreate = true"
        class="flex items-center gap-2 bg-white text-[#629FAD] text-sm font-semibold px-4 py-2 rounded-xl hover:bg-white/90 transition-all"
      >
        <span class="material-icons text-sm">person_add</span>
        New User
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex flex-col items-center justify-center gap-4 py-24">
      <div class="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      <p class="text-white/70 text-sm">Loading users...</p>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="flex flex-col items-center justify-center gap-3 py-24">
      <span class="material-icons text-red-300 text-5xl">error_outline</span>
      <p class="text-white/70 text-sm">{{ store.error }}</p>
      <button @click="store.fetchUsers()" class="text-sm text-white underline">Try again</button>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-2xl overflow-hidden shadow-sm">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-gray-50 border-b border-gray-100">
            <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">User</th>
            <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Role</th>
            <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
            <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Created</th>
            <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(user, i) in store.users"
            :key="user.user_id"
            :class="['border-b border-gray-50 hover:bg-gray-50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50']"
          >
            <!-- User -->
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-[#629FAD]/20 flex items-center justify-center text-[#629FAD] text-sm font-bold uppercase">
                  {{ user.username.charAt(0) }}
                </div>
                <div>
                  <p class="font-semibold text-gray-800">{{ user.username }}</p>
                  <p class="text-xs text-gray-400 font-mono">{{ user.user_id.slice(0, 8) }}...</p>
                </div>
              </div>
            </td>

            <!-- Role -->
            <td class="px-5 py-3.5">
              <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full capitalize', roleBadge(user.role)]">
                {{ user.role }}
              </span>
            </td>

            <!-- Status toggle -->
            <td class="px-5 py-3.5">
              <button
                @click="store.toggleActive(user.user_id, !user.active)"
                :class="[
                  'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all',
                  user.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'
                ]"
              >
                <span :class="['w-1.5 h-1.5 rounded-full', user.active ? 'bg-green-500' : 'bg-red-400']" />
                {{ user.active ? 'Active' : 'Inactive' }}
              </button>
            </td>

            <!-- Created -->
            <td class="px-5 py-3.5 text-xs text-gray-400">
              {{ formatDate(user.created_at) }}
            </td>

            <!-- Actions -->
            <td class="px-5 py-3.5">
              <button
                @click="openPasswordModal(user.user_id, user.username)"
                class="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
              >
                <span class="material-icons text-sm">lock_reset</span>
                Change PIN
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create User Modal -->
    <q-dialog v-model="showCreate">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-base font-bold text-gray-800">Create New User</h3>
          <button @click="showCreate = false" class="text-gray-400 hover:text-gray-600">
            <span class="material-icons text-sm">close</span>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">Username</label>
            <input
              v-model="createForm.username"
              type="text"
              placeholder="e.g. john_doe"
              class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#629FAD] transition-all"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">PIN</label> <!-- ← Password → PIN -->
            <input
              v-model="createForm.pin"
              type="password"
              placeholder="Min. 4 digits"
              class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#629FAD] transition-all"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">Role</label>
            <select
              v-model="createForm.role"
              class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#629FAD] transition-all"
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
            </select>
          </div>
        </div>

        <p v-if="createErr" class="text-xs text-red-500 mt-3">{{ createErr }}</p>

        <div class="flex gap-3 mt-6">
          <button
            @click="showCreate = false"
            class="flex-1 py-2 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
          <button
            @click="submitCreate"
            :disabled="creating"
            class="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-[#629FAD] hover:bg-[#4e8a98] transition-all disabled:opacity-50"
          >
            {{ creating ? 'Creating...' : 'Create User' }}
          </button>
        </div>
      </div>
    </q-dialog>

    <!-- Change PIN Modal -->
    <q-dialog v-model="showPassword">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div class="flex items-center justify-between mb-1">
          <h3 class="text-base font-bold text-gray-800">Change PIN</h3> <!-- ← Password → PIN -->
          <button @click="showPassword = false" class="text-gray-400 hover:text-gray-600">
            <span class="material-icons text-sm">close</span>
          </button>
        </div>
        <p class="text-xs text-gray-400 mb-5">
          For user: <span class="font-semibold text-gray-600">{{ selectedUsername }}</span>
        </p>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">New PIN</label>
            <input
              v-model="newPassword"
              type="password"
              placeholder="Min. 4 digits"
              class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#629FAD] transition-all"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">Confirm PIN</label>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="Repeat PIN"
              class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#629FAD] transition-all"
            />
          </div>
        </div>

        <p v-if="passwordErr" class="text-xs text-red-500 mt-3">{{ passwordErr }}</p>

        <div class="flex gap-3 mt-6">
          <button
            @click="showPassword = false"
            class="flex-1 py-2 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
          <button
            @click="submitPassword"
            :disabled="savingPassword"
            class="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-[#629FAD] hover:bg-[#4e8a98] transition-all disabled:opacity-50"
          >
            {{ savingPassword ? 'Saving...' : 'Update PIN' }}
          </button>
        </div>
      </div>
    </q-dialog>

  </q-page>
</template>