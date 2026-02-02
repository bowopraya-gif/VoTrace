import { create } from 'zustand';
import api from '@/lib/api';
import { AuthState, User } from '@/types/auth';

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start loading to check auth on mount

    login: async (credentials) => {
        // Get CSRF cookie first
        await api.get('/sanctum/csrf-cookie', { baseURL: 'http://localhost:8000' });

        // Login
        try {
            const response = await api.post('/login', {
                login: credentials.login,
                password: credentials.password,
                remember: credentials.remember || false,
            });
            set({
                user: response.data.user,
                isAuthenticated: true,
                isLoading: false
            });
        } catch (error: any) {
            if (error.response?.status === 403 && error.response?.data?.requires_verification) {
                // Re-throw special error to be handled by component
                throw { requires_verification: true, email: error.response.data.email };
            }
            throw error;
        }
    },

    register: async (data) => {
        await api.get('/sanctum/csrf-cookie', { baseURL: 'http://localhost:8000' });
        // Registration now sends OTP, does not return token immediately
        const response = await api.post('/register', data);
        // Use user data if available, but they are not authenticated yet
        // Do not set isAuthenticated true.
        return response.data;
    },

    verifyEmail: async (data) => {
        // data = { email, otp }
        const response = await api.post('/verify-email', data);
        set({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false
        });
    },

    logout: async () => {
        try {
            await api.post('/logout');
        } catch (error) {
            // Log but don't block - client cleanup must happen regardless
            console.error('Logout API call failed:', error);
        } finally {
            // === CRITICAL: Client-side cleanup (runs even if API fails) ===

            // 1. Clear Zustand state immediately
            set({ user: null, isAuthenticated: false, isLoading: false });

            // 2. Clear all storage (browser-only check for SSR safety)
            if (typeof window !== 'undefined') {
                // Clear specific auth-related items
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                localStorage.removeItem('user_data');

                // Clear session storage completely
                sessionStorage.clear();

                // 3. HARD RELOAD to /login
                // This is intentional - NOT using React Router navigation
                // Hard reload clears the entire JavaScript memory heap,
                // ensuring no sensitive data remains in memory
                // 3. HARD RELOAD to /login
                // This is intentional - NOT using React Router navigation
                // Hard reload clears the entire JavaScript memory heap,
                // ensuring no sensitive data remains in memory
                window.location.href = '/login';
                // console.log("LOGOUT COMPLETE. Stoppping redirect for debugging.");
            }
        }
    },

    /**
     * Logout from ALL devices.
     * Use for security features like "Sign out everywhere"
     */
    logoutAll: async () => {
        try {
            await api.post('/logout-all');
        } catch (error) {
            console.error('Logout all API call failed:', error);
        } finally {
            // Same cleanup as regular logout
            set({ user: null, isAuthenticated: false, isLoading: false });

            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                localStorage.removeItem('user_data');
                sessionStorage.clear();
                window.location.href = '/login?logged_out_all=true';
            }
        }
    },

    fetchUser: async () => {
        if (!get().isAuthenticated) {
            set({ isLoading: true });
        }
        try {
            const response = await api.get('/user');
            set({ user: response.data, isAuthenticated: true });
        } catch (error) {
            set({ user: null, isAuthenticated: false });
        } finally {
            set({ isLoading: false });
        }
    },
}));
