import { defineStore } from 'pinia';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export interface InventoryBatch {
  batch_id: string;
  item_id: string;
  user_id: string;
  invoice_id: string;
  qty_received: number;
  qty_remaining: number;
  unit_cost: number;
  expiration_date: string | null;
  expiration_source: string | null;
  logged_at: string;
  requires_manual_expiry: boolean;
  status: 'available' | 'consumed' | 'expired';
  is_valid: boolean | null;
  days_remaining: number | null;
  inventory_items?: {
    name: string;
    category: string;
    reorder_level: number;
  };
}

export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    items: [] as InventoryBatch[],
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchItems() {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${BACKEND_URL}/api/inventory/active`);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const json = await response.json();

        this.items = (json.inventory ?? []).map((item: InventoryBatch) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (item.requires_manual_expiry || !item.expiration_date) {
            return { ...item, is_valid: null, days_remaining: null };
          }

          const expiry = new Date(item.expiration_date);
          const diffMs = expiry.getTime() - today.getTime();
          const days_remaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));

          return { ...item, is_valid: days_remaining >= 0, days_remaining };
        });

      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : 'Unknown error';
      } finally {
        this.loading = false;
      }
    },

    async deleteBatch(batch_id: string) {
      const response = await fetch(`${BACKEND_URL}/api/inventory/batch/${batch_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qty_remaining: 0 }),
      });
      if (!response.ok) throw new Error('Failed to mark as consumed');
      this.items = this.items.filter(i => i.batch_id !== batch_id);
    },

    async updateBatch(
      batch_id: string,
      payload: {
        qty_remaining?: number;
        unit_cost?: number;
        expiration_date?: string | null;
        user_id?: string | null;
      }
    ) {
      const response = await fetch(`${BACKEND_URL}/api/inventory/batch/${batch_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to update batch');
      await this.fetchItems();
    },
  },
});