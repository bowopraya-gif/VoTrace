'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertCircle,
    Calendar,
    Clock,
    Trophy
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend,
    AreaChart,
    Area,
    LabelList
} from 'recharts';
import { StatsPeriod, VocabularyStats } from '@/types/statistics';
import api from '@/lib/api';
import DrillDownModal from '../DrillDownModal';
import Link from 'next/link';

interface VocabularyStatsSectionProps {
    stats: VocabularyStats | undefined;
    isLoading: boolean;
    period: StatsPeriod;
    timezone: string;
}

export default function VocabularyStatsSection({ stats, isLoading, period, timezone }: VocabularyStatsSectionProps) {
    // Internal state removed - data controlled by parent

    // Drill Down State
    const [drillType, setDrillType] = useState<string | null>(null);
    const [drillValue, setDrillValue] = useState<string | null>(null);
    const [drillLabel, setDrillLabel] = useState<string>('');

    const simplifiedSrs = useMemo(() => {
        if (!stats) return [];
        const newCount = stats.srs_breakdown.find(s => s.level === 0)?.count || 0;
        const learningCount = stats.srs_breakdown.filter(s => s.level >= 1 && s.level <= 4).reduce((a, b) => a + b.count, 0);
        const proficientCount = stats.srs_breakdown.filter(s => s.level >= 5 && s.level <= 6).reduce((a, b) => a + b.count, 0);
        const masteredCount = stats.srs_breakdown.filter(s => s.level >= 7).reduce((a, b) => a + b.count, 0);

        return [
            { label: 'New', count: newCount, color: '#f43f5e', desc: 'Just started' },
            { label: 'Learning', count: learningCount, color: '#f59e0b', desc: 'Building memory' },
            { label: 'Proficient', count: proficientCount, color: '#3b82f6', desc: 'Getting strong' },
            { label: 'Mastered', count: masteredCount, color: '#10b981', desc: 'Long-term memory' },
        ];
    }, [stats]);

    const handleReviewClick = (type: string, label: string) => {
        setDrillType('review_status');
        setDrillValue(type);
        setDrillLabel(label);
    };

    // Error handling moved to parent or kept specific handled
    if (isLoading || !stats) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-slate-100 rounded-3xl" />
            ))}
        </div>
    );

    const cardStyle = "bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgb(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgb(0,0,0,0.04)] transition-all flex flex-col";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* ROW 1: (1) Status Distribution & (8) Mastered Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. Status Distribution (Pie Chart) - FIXED VISIBILITY */}
                <div className={`${cardStyle}`}>
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Status Distribution</h3>
                        <p className="text-sm text-slate-500">Mastery Snapshot</p>
                    </div>
                    {/* Fixed Height Container */}
                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Mastered', value: Number(stats.overview.mastered), color: '#10b981' },
                                        { name: 'Learning', value: Number(stats.overview.learning), color: '#f59e0b' },
                                        { name: 'Review', value: Number(stats.overview.review), color: '#f43f5e' },
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="60%"
                                    outerRadius="80%"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {[{ color: '#10b981' }, { color: '#f59e0b' }, { color: '#f43f5e' }].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    position={{ y: 0 }}
                                    cursor={{ fill: '#f8fafc', radius: 8 }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload; // Recharts Pie payload structure
                                            // data has: name, value, color, etc.
                                            return (
                                                <div className="bg-slate-900/95 backdrop-blur-sm text-white text-xs p-3 rounded-xl shadow-xl border border-slate-800">
                                                    <div className="font-bold mb-1 text-sm text-white">{data.name}</div>
                                                    <div className="flex items-center justify-between gap-6">
                                                        <span className="text-slate-400">Count:</span>
                                                        <span className="font-mono font-bold text-white text-sm">{data.value}</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Centered Mastery Rate */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                            <span className="text-3xl font-black text-slate-800">{stats.overview.mastery_rate}%</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mastery</span>
                        </div>
                    </div>
                </div>

                {/* 8. Mastered Activity (Moved from bottom) */}
                <div className={`${cardStyle} lg:col-span-2`}>
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Mastered Activity</h3>
                        <p className="text-sm text-slate-500">Mastered words over time</p>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.recent_activity.slice(-7)} margin={{ left: -20, right: 20, top: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="masteredGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#0A56C8" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="#0A56C8" stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                    minTickGap={0}
                                    interval={0} // Force show all ticks
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    allowDecimals={false} // Prevent 0.5, 1.5 etc
                                />
                                <Tooltip
                                    cursor={{ stroke: '#0A56C8', strokeWidth: 1, strokeDasharray: '3 3' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-slate-900/95 backdrop-blur-sm text-white text-xs p-3 rounded-xl shadow-xl border border-slate-800">
                                                    <div className="font-bold mb-2 text-slate-300">
                                                        {label ? new Date(label).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-[#0A56C8] shadow-[0_0_8px_rgba(10,86,200,0.6)]" />
                                                        <span className="text-slate-300">Mastered:</span>
                                                        <span className="font-mono font-bold text-blue-300 text-sm">
                                                            {payload[0].value}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    name="Words Mastered"
                                    type="monotone"
                                    dataKey="mastered"
                                    stroke="#0A56C8"
                                    strokeWidth={3}
                                    fill="url(#masteredGradient)"
                                    dot={{ fill: '#0A56C8', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                    activeDot={{ r: 6, fill: '#0A56C8', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ROW 2: Part of Speech (Modern Horizontal Bar) */}
            <div className={cardStyle}>
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Part of Speech</h3>
                        <p className="text-sm text-slate-500">Grammar distribution</p>
                    </div>
                    {/* Optional: Add a subtle badge or total count if needed */}
                </div>
                {/* Dynamic height based on data length */}
                <div style={{ height: Math.max(300, (stats?.by_part_of_speech?.length || 0) * 50) }} className="w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={stats.by_part_of_speech}
                            layout="vertical"
                            margin={{ left: 10, right: 50, top: 10, bottom: 10 }}
                        >
                            <defs>
                                <linearGradient id="posGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#2563eb" />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis
                                type="number"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                                tickCount={10}
                                allowDecimals={false}
                            />
                            <YAxis
                                dataKey="label"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }}
                                width={100}
                            />
                            <Tooltip
                                cursor={{ fill: '#f8fafc', radius: 8 }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700">
                                                <div className="font-bold text-sm mb-1 text-white">{data.label}</div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                                                    <span className="text-slate-300">Count:</span>
                                                    <span className="font-bold text-white">{data.count}</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar
                                dataKey="count"
                                fill="url(#posGradient)"
                                radius={[0, 100, 100, 0]}
                                barSize={28}
                                animationDuration={1000}
                            >
                                <LabelList
                                    dataKey="count"
                                    position="right"
                                    fill="#64748b"
                                    fontSize={12}
                                    fontWeight={700}
                                    offset={10}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ROW 3: (7) Improvement Zone & (New) Vocabulary Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">

                {/* Vocabulary Heatmap (Calendar Grid) - Spans 4 cols */}
                <div className={`${cardStyle} lg:col-span-4`}>
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Daily Vocabulary Added</h3>
                            <p className="text-sm text-slate-500">2026 Consistency</p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>Less</span>
                            <div className="w-3 h-3 bg-slate-100 rounded-sm" />
                            <div className="w-3 h-3 bg-[#0A56C8]/30 rounded-sm" />
                            <div className="w-3 h-3 bg-[#0A56C8]/60 rounded-sm" />
                            <div className="w-3 h-3 bg-[#0A56C8] rounded-sm" />
                            <span>More</span>
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <div className="w-full">
                            {/* Days Header (1-31) */}
                            <div className="flex gap-1 mb-1 pl-10">
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                    <div key={day} className="flex-1 text-[8px] text-slate-400 text-center font-medium">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Months Rows */}
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, monthIdx) => {
                                const daysInMonth = new Date(2026, monthIdx + 1, 0).getDate();

                                return (
                                    <div key={month} className="flex items-center gap-1 mb-1">
                                        <div className="w-8 text-[10px] text-slate-500 font-semibold shrink-0">
                                            {month}
                                        </div>
                                        {Array.from({ length: 31 }, (_, dayIdx) => {
                                            const day = dayIdx + 1;
                                            const isValidDay = day <= daysInMonth;

                                            // Format date as YYYY-MM-DD
                                            const year = 2026;
                                            const dateString = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                                            const dayData = stats.daily_heatmap?.find((d: any) => d.date === dateString);
                                            const count = dayData?.count || 0;

                                            let colorClass = 'bg-slate-100'; // Default visible empty cell
                                            if (count > 0) {
                                                if (count >= 10) colorClass = 'bg-[#0A56C8]';
                                                else if (count >= 5) colorClass = 'bg-[#0A56C8]/80';
                                                else if (count >= 3) colorClass = 'bg-[#0A56C8]/60';
                                                else colorClass = 'bg-[#0A56C8]/30';
                                            }

                                            return (
                                                <div key={dayIdx} className={`flex-1 aspect-square rounded-[3px] relative group transition-all ${isValidDay ? colorClass : 'bg-transparent'} ${isValidDay ? 'hover:ring-2 hover:ring-slate-400/50 cursor-default' : ''}`}>
                                                    {isValidDay && (
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                                            <div className="bg-slate-900 text-white text-[10px] px-2 py-1.5 rounded-md shadow-xl whitespace-nowrap">
                                                                <div className="font-bold">{count} words</div>
                                                                <div className="text-slate-300 font-medium">{month} {day}, {year}</div>
                                                            </div>
                                                            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-900 absolute left-1/2 -translate-x-1/2 top-full"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 7. Improvement Zone - Spans 2 cols */}
                <div className={`${cardStyle} lg:col-span-2`}>
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <AlertCircle className="text-rose-500" size={20} />
                            Improvement Zone
                        </h3>
                        <p className="text-sm text-slate-500">Words needing extra attention</p>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 space-y-3 custom-scrollbar">
                        {stats.improvement_zone.length > 0 ? (
                            stats.improvement_zone.map((word) => (
                                <Link href={`/vocabulary/${word.id}`} key={word.id} className="block group">
                                    <div className="flex items-center p-3 bg-rose-50/50 rounded-xl border border-rose-100/50 hover:bg-rose-50 transition-colors cursor-pointer">
                                        <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center text-rose-500 font-bold text-xs shadow-sm mr-3 shrink-0 group-hover:scale-110 transition-transform">
                                            {word.times_wrong}x
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-slate-800 text-sm truncate group-hover:text-rose-600 transition-colors">{word.word}</div>
                                            <div className="text-xs text-rose-600/70 truncate">{word.translation}</div>
                                        </div>
                                        <div className={`text-[10px] font-bold px-2 py-1 rounded-md border ${word.difficulty > 70 ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                                            }`}>
                                            {word.times_correct}/{word.total_attempts} Correct
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <Trophy className="mb-2 text-slate-300" size={24} />
                                <p>No trouble words found! Keep it up!</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* ROW 4: Due for Review (Moved from top) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ReviewCard
                    label="Overdue"
                    value={stats.due_for_review.overdue}
                    color="rose"
                    icon={AlertCircle}
                    description="Review immediately!"
                    onClick={() => handleReviewClick('overdue', 'Overdue Vocabulary')}
                />
                <ReviewCard
                    label="Today"
                    value={stats.due_for_review.today}
                    color="amber"
                    icon={Calendar}
                    description="Keep the streak!"
                    onClick={() => handleReviewClick('today', 'Review Due Today')}
                />
                <ReviewCard
                    label="Soon (7 Days)"
                    value={stats.due_for_review.upcoming_7_days}
                    color="blue"
                    icon={Clock}
                    description="Prepare ahead"
                    onClick={() => handleReviewClick('soon', 'Upcoming Reviews')}
                />
            </div>

            {/* Drill Down Modal */}
            {drillType && (
                <DrillDownModal
                    type={drillType}
                    value={drillValue || ''}
                    label={drillLabel}
                    timezone={timezone}
                    onClose={() => setDrillType(null)}
                />
            )}
        </motion.div>
    );
}

function ReviewCard({ label, value, color, icon: Icon, description, onClick }: {
    label: string;
    value: number;
    color: 'rose' | 'amber' | 'blue';
    icon: any;
    description: string;
    onClick?: () => void;
}) {
    const colorStyles = {
        rose: 'bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-rose-100 group-hover:border-rose-200',
        amber: 'bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-100 group-hover:border-amber-200',
        blue: 'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-100 group-hover:border-blue-200',
    };

    const textStyles = {
        rose: 'text-rose-600',
        amber: 'text-amber-600',
        blue: 'text-blue-600',
    };

    return (
        <div
            onClick={onClick}
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between h-full cursor-pointer group ${colorStyles[color]} hover:shadow-md hover:-translate-y-1`}
        >
            <div className="flex justify-between items-start mb-2">
                <div className={`p-2 bg-white/60 rounded-xl ${textStyles[color]} group-hover:bg-white`}>
                    <Icon size={18} strokeWidth={2.5} />
                </div>
                <div className={`text-3xl font-black tracking-tight ${textStyles[color]}`}>
                    {value}
                </div>
            </div>
            <div>
                <div className={`text-xs font-bold uppercase tracking-wider opacity-80 ${textStyles[color]}`}>
                    {label}
                </div>
                <p className={`text-[10px] font-medium opacity-60 mt-0.5 ${textStyles[color]}`}>
                    {description}
                </p>
            </div>
        </div>
    );
}
