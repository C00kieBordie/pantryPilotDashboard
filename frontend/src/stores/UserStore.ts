import { defineStore } from 'pinia';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export interface User {
  user_id: string;
  username: string;
  role: string;
  active: boolean;
  created_at: string;
}

export const useUserStore = defineStore('users', {
  state: () => ({
    users: [] as User[],
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchUsers() {
      this.loading = true;
      this.error = null;
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/users/all`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const json = await res.json();
        this.users = json.users ?? [];
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : 'Unknown error';
      } finally {
        this.loading = false;
      }
    },

    async createUser(payload: { username: string; pin: string; role: string }) {
      const res = await fetch(`${BACKEND_URL}/api/auth/users/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to create user');
      await this.fetchUsers();
    },

    async changePin(user_id: string, new_pin: string) {
      const res = await fetch(`${BACKEND_URL}/api/auth/users/${user_id}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_pin }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to change PIN');
    },

    async toggleActive(user_id: string, active: boolean) {
      const res = await fetch(`${BACKEND_URL}/api/auth/users/${user_id}/toggle-active`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to toggle user');
      const user = this.users.find(u => u.user_id === user_id);
      if (user) user.active = active;
    },
  },
});