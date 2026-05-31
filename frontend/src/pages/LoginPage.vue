<script setup lang="ts">
    import { ref } from 'vue';
    import { useRouter } from 'vue-router';
    import { useQuasar } from 'quasar';
    import { useAuthStore } from 'src/stores/auth-store';

    const $q = useQuasar();
    const authStore = useAuthStore();
    const router = useRouter();

    // Configuration
    const BACKEND_URL = 'http://localhost:3000'; // Target your API server directly

    // Form State
    const username = ref('');
    const password = ref('');
    const loading = ref(false);
    interface TenantUser {
        user_id: string;
        username: string;
        role: string;
    }

    async function login() {
        if (!username.value.trim() || !password.value) {
            alert('Please enter both username and password.');
            return;
        }

        loading.value = true;
        try {
            const usersResponse = await fetch(`${BACKEND_URL}/api/auth/users`);
            const users: TenantUser[] = await usersResponse.json();
            if (!usersResponse.ok) {
                alert('Failed to connect to user database.');
                return;
            }

            const matchedUser = users.find(
                (u: TenantUser) => u.username.toLowerCase() === username.value.toLowerCase().trim()
            );

            if (!matchedUser) {
                alert('Invalid username or password.');
                return;
            }

            // Step 2: Send the matched user's ID along with the password/PIN to your login endpoint
            const loginResponse = await fetch(`${BACKEND_URL}/api/auth/verify-pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: matchedUser.user_id, 
                    pin: password.value // This maps to the "pin" field required by your controller
                })
                
            });

            const data = await loginResponse.json();

            if (loginResponse.ok && data.success) {
                // Save active session data to store and cookies
                authStore.login(data.user, data.token || 'session-active');
                
                
                $q.cookies.set('userProfile', data.user, { expires: '1d' });

                // Route redirection based on role rules
                if (data.user?.role === 'Manager') {
                    console.log('redirecting to admin page');
                    await router.push('/admin/');
                } else {
                    console.log('redirecting to user page');
                    await router.push('/');
                }
            } else {
                alert(data.error || 'Invalid username or password.');
            }
        } catch (error) {
            console.error("Authentication connection failed", error);
            alert('Server communication error.');
        } finally {
            loading.value = false;
        }
    }
</script>

<template>
    <q-page>
        <div class="h-screen w-full flex items-center justify-center">
            <div class="w-11/12 md:w-[40%] bg-[#E1D9BC] shadow-2 rounded-xl overflow-hidden">
                <q-tabs class="text-dark">
                    <q-tab name="login" label="Login"/>
                </q-tabs>
                <q-separator />

                <div class="q-pa-lg q-gutter-y-md">
                    <q-input 
                        v-model="username" 
                        label="Username:" 
                        stack-label 
                        autocomplete="username"
                        @keyup.enter="login"
                    />
                    <q-input 
                        v-model="password" 
                        label="Password:" 
                        type="password" 
                        stack-label
                        @keyup.enter="login"
                    />
                    <q-btn 
                        label="Login" 
                        class="bg-green full-width rounded-md text-white" 
                        :loading="loading"
                        @click="login"
                    />
                </div>
            </div>
        </div>
    </q-page>
</template>