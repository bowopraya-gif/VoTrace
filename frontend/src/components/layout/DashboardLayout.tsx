"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Header from './Header';
import StreakWidget from '../streak/StreakWidget';
import StreakPopup from '../streak/StreakPopup';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { isAuthenticated, isLoading, fetchUser } = useAuthStore();
    const pathname = usePathname();

    const isFocusMode = pathname?.startsWith('/practice/session');

    // Always fetch user on mount to verify auth status with server
    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            // Use hard redirect to ensure full page reload and clear React state
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
                // console.log("Redirect blocked for debugging (Not Authenticated)");
            }
        }
    }, [isLoading, isAuthenticated]);

    // FOCUS MODE GUARD
    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') return;

        const checkGuard = () => {
            const activeSessionId = sessionStorage.getItem('active_practice_id');
            // If we have an active session, but we are NOT on the session page
            // We should restrict navigation.
            if (activeSessionId && !pathname?.startsWith('/practice/session')) {
                // Prevent infinite loop if we are already redirecting
                if (pathname === `/practice/session`) return;

                console.log("Restricting navigation: Active Session detected.");
                window.location.href = `/practice/session?id=${activeSessionId}`;
            }
        };

        checkGuard();
    }, [pathname]);


    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {!isFocusMode && <Header />}

            <main className={`flex-1 w-full mx-auto ${isFocusMode ? '' : 'max-w-7xl px-4 py-6 md:py-8'}`}>
                {children}
            </main>

            {/* Streak Widget - Hide in Focus Mode */}
            {!isFocusMode && (
                <>
                    <StreakWidget />
                    <StreakPopup />
                </>
            )}
        </div>
    );
}
