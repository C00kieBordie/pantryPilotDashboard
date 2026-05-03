import { defineStore } from 'pinia';

export interface User {
  id: number;
  email: string;
  status: 'admin' | 'user';
  name?: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const savedUser = localStorage.getItem('user');
    
    const userValue = (savedUser && savedUser !== 'undefined') 
      ? JSON.parse(savedUser) 
      : null;

    return {
      user: userValue as User | null,
      token: localStorage.getItem('token') || '',
    }
  },
  
  actions: {
    login(userData: User, token: string) {
      this.user = userData;
      this.token = token;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));    },
    
    logout() {
      this.user = null;
      this.token = '';
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },
});