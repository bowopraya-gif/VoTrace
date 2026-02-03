import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
    withXSRFToken: true,
});

// Get user's timezone
const getUserTimezone = (): string => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
        return 'UTC';
    }
};

// Request interceptor to auto-append timezone to all requests
api.interceptors.request.use((config) => {
    const timezone = getUserTimezone();

    // For GET requests, add to params
    if (config.method?.toLowerCase() === 'get') {
        config.params = {
            ...config.params,
            tz: config.params?.tz || timezone, // Don't override if already set
        };
    } else {
        // For POST/PUT/PATCH, add to request body if it's JSON
        if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
            config.data = {
                ...config.data,
                tz: config.data.tz || timezone,
            };
        }
    }

    return config;
});

api.interceptors.response.use(
    response => response,
    async error => {
        const status = error.response?.status;

        // Handle 429 Too Many Requests (Rate Limited)
        if (status === 429) {
            const retryAfter = error.response?.headers?.['retry-after'] || 60;
            console.warn(`Rate limited. Retry after ${retryAfter} seconds.`);
            return Promise.reject(error);
        }

        // Handle 401 Unauthorized - session expired or invalid token
        if (status === 401) {
            // Prevent redirect loops on public pages
            const publicPaths = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password', '/auth/google/success'];
            const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

            // Only redirect if NOT already on a public page
            if (!publicPaths.some(p => currentPath.startsWith(p))) {
                if (typeof window !== 'undefined') {
                    // Clear all storage
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('user_data');
                    sessionStorage.clear();

                    // Hard redirect with session expired flag
                    window.location.href = '/login?session_expired=true';
                }
            }
            return Promise.reject(error);
        }

        // Handle 419 CSRF Token Mismatch
        if (status === 419) {
            // Prevent infinite loop
            if (error.config._retry) {
                return Promise.reject(error);
            }
            error.config._retry = true;

            // CSRF token mismatch, refresh cookie and retry
            const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
            await axios.get(`${baseUrl}/sanctum/csrf-cookie`, { withCredentials: true });
            return api.request(error.config);
        }

        return Promise.reject(error);
    }
);

export default api;
