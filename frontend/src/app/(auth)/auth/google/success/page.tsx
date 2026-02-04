'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function GoogleSuccessPage() {
    const router = useRouter();
    const { fetchUser, isAuthenticated } = useAuthStore();

    useEffect(() => {
        // Fetch user data (session cookie is already set by backend)
        fetchUser().then(() => {
            // Redirect to dashboard after fetching user
            router.push('/dashboard');
        }).catch(() => {
            // If fetch fails, redirect to login
            router.push('/login?error=google_auth_failed');
        });
    }, [fetchUser, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
            <div className="text-center space-y-4">
                <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-neutral-600 font-medium">Completing login...</p>
            </div>
        </div>
    );
}
