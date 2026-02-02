"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { StreakStats } from '@/types/streak';
import StreakHero from '@/components/streak/StreakHero';
import StreakStatsCards from '@/components/streak/StreakStatsCards';
import StreakMonthCalendar from '@/components/streak/StreakMonthCalendar';
import StreakHistory from '@/components/streak/StreakHistory';
import { useStreakStore } from '@/stores/streakStore';

export default function StreakPage() {
    // We can use the store's basic status, but for this page we want detailed stats
    // The endpoint is /api/streak/stats which returns StreakStats object

    // However, store only holds 'StreakStatus'. 
    // Let's fetch detailed stats locally for this page, or rely on store if updated.
    // The store's 'fetchStatus' gets /api/streak which might send less data than /api/streak/stats?
    // Let's check the backend:
    // StreakController::status returns getStreakStatus() -> array [current, longest, added_today, is_active, last_active, total_active]
    // StreakController::stats returns array [current, longest, total_active, started_at, avg_per_day]

    // They are slightly different (stats has avg and started_at).
    // Let's fetch detailed stats here.

    const [stats, setStats] = useState<StreakStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { fetchStatus } = useStreakStore(); // to update global widget if needed

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch Detailed Stats
                const res = await api.get('/streak/stats');

                // We also need the 'added_today' and 'is_active' which is in the basic status
                // Or we can infer it. 
                // Let's also refresh the global store
                await fetchStatus();

                // Combine data? 
                // The /stats endpoint returns partial data. 
                // Let's assume we can merge them or just use what /stats gives + logic
                // Update: /stats gives basic numbers. useStreakStore gives 'added_today' flag which is important for Hero.

                // Let's use the store's status for the Hero mostly, and /stats for the Cards (avg).
                // Actually StreakHero needs 'StreakStatus' (added_today).
                // StreakStatsCards needs 'StreakStats' (avg).

                setStats(res.data);
            } catch (error) {
                console.error("Failed to load streak stats", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [fetchStatus]);

    // Get global status for Hero (contains is_active, added_today)
    const { status: globalStatus } = useStreakStore();

    if (loading || !globalStatus || !stats) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Merge for safety if needed, or pass separately
    // Hero needs globalStatus (for 'added_today' boolean)
    // Cards need stats (for 'average_vocab_per_day')

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Hero Section */}
            <StreakHero status={globalStatus} />

            {/* Statistics Grid */}
            <div className="space-y-4">
                <StreakStatsCards stats={stats} />
            </div>

            {/* Calendar & History Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Monthly Calendar */}
                <StreakMonthCalendar />

                {/* Ranking History */}
                <StreakHistory />
            </div>
        </div>
    );
}
