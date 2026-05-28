import { defineStore } from 'pinia';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export interface ActivityLog {
  log_id: string;
  action_type: string;
  logged_at: string;
  inventory_batches: {
    batch_id: string;
    inventory_items: { name: string } | null;
  } | null;
  users: { username: string } | null;
}

export const useActivityLogStore = defineStore('activityLog', {
  state: () => ({
    logs: [] as ActivityLog[],
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchLogs() {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${BACKEND_URL}/api/inventory/activity-log`);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const json = await response.json();
        this.logs = json.log ?? [];
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : 'Unknown error';
      } finally {
        this.loading = false;
      }
    },
  },
});