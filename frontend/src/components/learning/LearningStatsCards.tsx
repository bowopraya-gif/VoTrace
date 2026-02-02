'use client';

import { LearningStats } from '@/types/learning';
import { Calendar, BookOpen, GraduationCap, Clock } from 'lucide-react';

import AnimatedCounter from '../ui/AnimatedCounter';

interface StatsProps {
    stats: LearningStats | null;
}

export default function LearningStatsCards({ stats }: StatsProps) {
    if (!stats) {
        // Skeleton Loading
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    // Format Time (Seconds -> HH:MM:SS or simpler)
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    const cards = [
        {
            label: 'Learned Today',
            value: stats.learned_today,
            yesterday: stats.learned_yesterday, // Add comparison value
            suffix: 'Lessons',
            icon: Calendar,
        },
        {
            label: 'Modules Started',
            value: stats.modules_started,
            suffix: 'Modules',
            icon: BookOpen,
        },
        {
            label: 'Lessons Completed',
            value: stats.lessons_completed,
            suffix: 'Total',
            icon: GraduationCap,
        },
        {
            label: 'Learning Time',
            value: stats.learning_time_seconds, // Pass raw seconds
            isTime: true,
            suffix: '',
            icon: Clock,
        }
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, idx) => {
                // ... (trend logic)
                // Trend Logic
                let trendIcon = null;
                let trendColor = '';

                if (typeof card.yesterday !== 'undefined') {
                    if (card.value > card.yesterday) {
                        trendIcon = '↑';
                        trendColor = 'text-emerald-500';
                    } else if (card.value < card.yesterday) {
                        trendIcon = '↓';
                        trendColor = 'text-red-500';
                    } else {
                        trendIcon = '-';
                        trendColor = 'text-slate-400';
                    }
                }


                return (
                    <div
                        key={idx}
                        className="relative overflow-hidden rounded-2xl p-6 border border-slate-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white group"
                    >
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white group-hover:shadow-sm">
                                    <card.icon size={20} className="transition-transform group-hover:scale-110" />
                                </div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {card.label}
                                </h3>
                            </div>
                            <div className="flex items-baseline gap-2">
                                {trendIcon && (
                                    <span
                                        className={`text-lg font-bold mr-1 ${trendColor} transition-transform duration-300 group-hover:scale-125`}
                                        title={`Yesterday: ${card.yesterday}`}
                                    >
                                        {trendIcon}
                                    </span>
                                )}
                                <span className="text-3xl font-black text-slate-800 tracking-tight tabular-nums">
                                    <AnimatedCounter
                                        value={card.value}
                                        formatter={(val) => card.isTime
                                            ? formatTime(val)
                                            : Math.floor(val).toLocaleString()
                                        }
                                    />
                                </span>
                                {card.suffix && (
                                    <span className="text-sm font-bold text-slate-400 hidden sm:inline-block">
                                        {card.suffix}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Decorative Background Icon */}
                        <div className="absolute -right-6 -bottom-6 opacity-[0.05] transition-transform duration-500 group-hover:scale-125 group-hover:-rotate-12 text-primary">
                            <card.icon size={120} />
                        </div>

                        {/* Gradient Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                );
            })}
        </div>
    );
}
