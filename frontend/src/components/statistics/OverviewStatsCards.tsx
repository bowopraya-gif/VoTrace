'use client';

import { motion } from 'framer-motion';
import { StatsOverview, StatsInsight } from '@/types/statistics';
import AnimatedCounter from './AnimatedCounter';
import { Sparkles, Trophy, Flame, Clock } from 'lucide-react';

interface OverviewStatsCardsProps {
    overview: StatsOverview | null;
    loading: boolean;
}

const CARDS_CONFIG = [
    {
        key: 'words_learned',
        label: 'Words Learned',
        icon: Sparkles,
        color: 'text-violet-600',
        bg: 'bg-violet-50',
        borderColor: 'border-violet-100',
    },
    {
        key: 'consistency_rate',
        label: 'Consistency',
        icon: Trophy,
        color: 'text-amber-500',
        bg: 'bg-amber-50',
        borderColor: 'border-amber-100',
        suffix: '%',
    },
    {
        key: 'average_per_day',
        label: 'Average / Day',
        icon: Flame,
        color: 'text-rose-500',
        bg: 'bg-rose-50',
        borderColor: 'border-rose-100',
        suffix: ' words',
    },
    {
        key: 'total_study_hours',
        label: 'Study Hours',
        icon: Clock,
        color: 'text-indigo-500',
        bg: 'bg-indigo-50',
        borderColor: 'border-indigo-100',
        suffix: 'h',
    },
];

export default function OverviewStatsCards({ overview, loading }: OverviewStatsCardsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-40 rounded-3xl bg-white shadow-sm border border-slate-100 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {CARDS_CONFIG.map((card, index) => {
                    const Icon = card.icon;
                    const value = overview?.[card.key as keyof StatsOverview] as number ?? 0;

                    return (
                        <motion.div
                            key={card.key}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            className={`
                                overflow-hidden rounded-3xl p-6
                                bg-white
                                border border-slate-100/50
                                shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]
                                transition-all duration-300
                                group flex flex-col justify-between
                                h-44
                            `}
                        >
                            <div className="flex justify-between items-start">
                                <span className="text-sm font-semibold text-slate-400 tracking-wide uppercase">
                                    {card.label}
                                </span>
                                <div className={`p-3 rounded-2xl ${card.bg} ${card.color} transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                                    <Icon size={22} strokeWidth={2.5} />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-extrabold tracking-tight text-slate-900 group-hover:text-slate-800 transition-colors">
                                        <AnimatedCounter value={value} />
                                    </span>
                                    {card.suffix && (
                                        <span className="text-lg font-semibold text-slate-400">
                                            {card.suffix}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Insights Row */}
            {overview?.insights && overview.insights.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {overview.insights.map((insight, index) => (
                        <InsightCard key={index} insight={insight} index={index} />
                    ))}
                </div>
            )}
        </div>
    );
}

function InsightCard({ insight, index }: { insight: StatsInsight; index: number }) {
    const isPositive = insight.trend === 'up';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + (index * 0.1) }}
            className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]"
        >
            <div className={`p-2 rounded-xl shrink-0 ${isPositive ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-600'}`}>
                {isPositive ? <Sparkles size={18} /> : <Sparkles size={18} />}
            </div>
            <div>
                <p className="font-semibold text-slate-800 leading-tight">
                    {insight.message}
                </p>
                <div className="flex items-center gap-2 mt-2">
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Insight
                    </span>
                    {insight.trend && (
                        <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-slate-500'}`}>
                            {isPositive ? '+ Trending Up' : 'Flat Trend'}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
