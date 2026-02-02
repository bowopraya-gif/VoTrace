"use client";

import { useQuery } from '@tanstack/react-query';
import QueryErrorState from '@/components/ui/QueryErrorState';
import api from '@/lib/api';
import { PracticeStats, PracticeHistoryItem } from '@/types/practice';
import PracticeStatsCards from '@/components/practice/PracticeStatsCards';
import PracticeModeCards from '@/components/practice/PracticeModeCards';
import PracticeHistoryTable from '@/components/practice/PracticeHistoryTable';

export default function PracticePage() {
    const {
        data: stats,
        isLoading: statsLoading,
        error: statsError,
        refetch: refetchStats
    } = useQuery({
        queryKey: ['practice', 'stats'],
        queryFn: () => api.get('/practice/stats').then(res => res.data),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const {
        data: history,
        isLoading: historyLoading,
        error: historyError,
        refetch: refetchHistory
    } = useQuery({
        queryKey: ['practice', 'history'],
        queryFn: () => api.get('/practice/history').then(res => res.data),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const handleRetry = () => {
        refetchStats();
        refetchHistory();
    };

    if (statsError || historyError) {
        return (
            <QueryErrorState
                message="Failed to load practice data. Please check your connection."
                onRetry={handleRetry}
            />
        );
    }

    if (statsLoading || historyLoading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-slate-100 rounded-2xl"></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-40 bg-slate-100 rounded-2xl"></div>
                    ))}
                </div>
                <div className="h-64 bg-slate-100 rounded-2xl"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

            {/* Statistics Cards */}
            <PracticeStatsCards stats={stats} />

            {/* Mode Selection */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">Select Mode</h2>
                <PracticeModeCards />
            </div>

            {/* History Table */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">Recent Activity</h2>
                <PracticeHistoryTable history={history || []} />
            </div>
        </div>
    );
}
