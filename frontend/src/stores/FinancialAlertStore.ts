import { defineStore } from 'pinia';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export interface FinancialAlert {
  alert_id:            string;
  batch_id:            string;
  alert_type:          string;
  monetary_risk_value: number;
  triggered_at:        string;
  status:              string;
  date_read:           string | null;
  read_by:             string | null;
}

export const useFinancialAlertStore = defineStore('financialAlerts', {
  state: () => ({
    alerts:  [] as FinancialAlert[],
    loading: false,
    error:   null as string | null,
  }),
  actions: {
    async fetchAlerts() {
      this.loading = true;
      this.error   = null;
      try {
        const res = await fetch(`${BACKEND_URL}/api/inventory/financial-alerts`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const json = await res.json();
        this.alerts = json.alerts ?? [];
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : 'Unknown error';
      } finally {
        this.loading = false;
      }
    },

    async markRead(alert_id: string, user_id: string | null) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/inventory/financial-alerts/${alert_id}/read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id }),
    });
    if (!res.ok) throw new Error('Failed to mark as resolved');

    // Refetch instead of mutating locally — ensures backend state is source of truth
    await this.fetchAlerts();
  } catch (err: unknown) {
    this.error = err instanceof Error ? err.message : 'Failed to mark alert as resolved';
    throw err;
  }
},
  },
  getters: {
    unreadCount: (state) => state.alerts.filter(a => a.status !== 'read').length,
    readCount:   (state) => state.alerts.filter(a => a.status === 'resolved').length,
  },
});