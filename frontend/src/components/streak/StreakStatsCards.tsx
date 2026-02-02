"use client";

import { StreakStats } from '@/types/streak';
import { Trophy, Calendar, Percent, Star } from 'lucide-react';

interface StreakStatsCardsProps {
    stats: StreakStats | null;
}

export default function StreakStatsCards({ stats }: StreakStatsCardsProps) {
    if (!stats) return null;

    const items = [
        {
            label: 'Longest Streak',
            value: `${stats.longest_streak} Days`,
            icon: Trophy,
            color: 'text-amber-500',
            bg: 'bg-amber-50',
            border: 'border-amber-100'
        },
        {
            label: 'This Month',
            value: `${stats.this_month_count} Days`,
            icon: Calendar,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
            border: 'border-blue-100'
        },
        {
            label: 'Consistency Rate',
            value: `${stats.consistency_rate}%`,
            icon: Percent,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100'
        },
        {
            label: 'Total Active Days',
            value: `${stats.total_active_days} Days`,
            icon: Star,
            color: 'text-purple-500',
            bg: 'bg-purple-50',
            border: 'border-purple-100'
        }
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((item, index) => (
                <div
                    key={index}
                    className={`
                        flex flex-col items-center justify-center text-center p-6 rounded-2xl border bg-white shadow-sm transition-transform hover:scale-[1.02]
                        ${item.border}
                    `}
                >
                    <div className={`p-3 rounded-full mb-3 ${item.bg} ${item.color}`}>
                        <item.icon size={24} />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{item.value}</p>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mt-1">{item.label}</p>
                </div>
            ))}
        </div>
    );
}
