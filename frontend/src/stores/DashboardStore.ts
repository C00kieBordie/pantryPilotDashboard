import { defineStore } from 'pinia';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export interface Invoice {
  scanned_at: string;
  total_amount: number;
}

export interface ExpiredBatch {
  unit_cost: number;
  qty_remaining: number;
  expiration_date: string;
  logged_at: string;
  inventory_items: { name: string } | null;
}

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    totalSpent:      0,
    totalLost:       0,
    invoices:        [] as Invoice[],
    expiredBatches:  [] as ExpiredBatch[],
    loading:         false,
    error:           null as string | null,
  }),
  actions: {
    async fetchStats(range: 'week' | 'month' | 'year') {
      this.loading = true;
      this.error   = null;
      try {
        const res = await fetch(`${BACKEND_URL}/api/inventory/dashboard?range=${range}`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const json = await res.json();
        this.totalSpent     = json.totalSpent;
        this.totalLost      = json.totalLost;
        this.invoices       = json.invoices;
        this.expiredBatches = json.expiredBatches;
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : 'Unknown error';
      } finally {
        this.loading = false;
      }
    },
  },
});