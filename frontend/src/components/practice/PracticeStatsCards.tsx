"use client";

import { PracticeStats } from '@/types/practice';
import { BookOpen, CheckCircle, Target, Crown } from 'lucide-react';
import AnimatedCounter from '../ui/AnimatedCounter';

interface PracticeStatsCardsProps {
    stats: PracticeStats | null;
}

export default function PracticeStatsCards({ stats }: PracticeStatsCardsProps) {
    // Show skeletons while loading
    if (!stats) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse"></div>
                ))}
            </div>
        );
    }

    const items = [
        {
            label: 'Practiced Today',
            value: stats.words_practiced_today,
            isInteger: true,
            yesterday: stats.words_practiced_yesterday,
            suffix: 'Words',
            icon: BookOpen,
        },
        {
            label: 'Sessions Completed',
            value: stats.total_sessions,
            isInteger: true,
            suffix: 'Sessions',
            icon: CheckCircle,
        },
        {
            label: 'Average Accuracy',
            value: stats.average_accuracy,
            isInteger: false,
            suffix: '%',
            icon: Target,
        },
        {
            label: 'Mastered Today',
            value: stats.words_mastered_today || 0,
            isInteger: true,
            yesterday: stats.words_mastered_yesterday || 0,
            suffix: 'Words',
            icon: Crown,
        }
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((item, index) => {
                // Trend Logic
                let trendIcon = null;
                let trendColor = '';

                if (typeof item.yesterday !== 'undefined') {
                    if (item.value > item.yesterday) {
                        trendIcon = '↑';
                        trendColor = 'text-emerald-500';
                    } else if (item.value < item.yesterday) {
                        trendIcon = '↓';
                        trendColor = 'text-red-500';
                    } else {
                        trendIcon = '-';
                        trendColor = 'text-slate-400';
                    }
                }

                return (
                    <div
                        key={index}
                        className="relative overflow-hidden rounded-2xl p-6 border border-slate-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white group"
                    >
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white group-hover:shadow-sm">
                                    <item.icon size={20} className="transition-transform group-hover:scale-110" />
                                </div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {item.label}
                                </h3>
                            </div>
                            <div className="flex items-baseline gap-2">
                                {trendIcon && (
                                    <span
                                        className={`text-lg font-bold mr-1 ${trendColor} transition-transform duration-300 group-hover:scale-125`}
                                        title={`Yesterday: ${item.yesterday}`}
                                    >
                                        {trendIcon}
                                    </span>
                                )}
                                <span className="text-3xl font-black text-slate-800 tracking-tight tabular-nums">
                                    <AnimatedCounter
                                        value={item.value}
                                        formatter={(val) =>
                                            // Handle average accuracy (percentage) specially if needed, usually just int or 1 decimal
                                            // Since isInteger is false for accuracy, we can default to 1 decimal if it's float, or just int
                                            // Previous display was `${stats.average_accuracy}`, which is raw. 
                                            // Let's assume it can be float.
                                            item.isInteger
                                                ? Math.floor(val).toLocaleString()
                                                : val.toFixed(1).replace(/\.0$/, '')
                                        }
                                    />
                                </span>
                                {item.suffix && (
                                    <span className="text-sm font-bold text-slate-400 hidden sm:inline-block">
                                        {item.suffix}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Decorative Background Icon */}
                        <div className="absolute -right-6 -bottom-6 opacity-[0.05] transition-transform duration-500 group-hover:scale-125 group-hover:-rotate-12 text-primary">
                            <item.icon size={120} />
                        </div>

                        {/* Gradient Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                );
            })}
        </div>
    );
}
