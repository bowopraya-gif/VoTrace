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
import { useMobileTooltip } from '@/hooks/useMobileTooltip';

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

    const chartData = useMemo(() => {
        if (!stats) return [];
        // Extract data ensuring strictly numbers (force cast)
        const learning = Number(stats.overview.learning) || 0;
        const review = Number(stats.overview.review) || 0;
        const mastered = Number(stats.overview.mastered) || 0;

        const data = [
            { name: 'Learning', value: learning, color: '#F59E0B' },   // Amber-500
            { name: 'Review', value: review, color: '#3B82F6' },     // Blue-500
            { name: 'Mastered', value: mastered, color: '#10B981' }  // Emerald-500
        ];

        // Filter out zero values to avoid Recharts rendering issues if needed, 
        // but generally Recharts handles 0 fine by ignoring them. 
        // Keeping them is better for Legend.
        return data;
    }, [stats]);

    const processedMasteredActivity = useMemo(() => {
        if (!stats) return [];

        // Generate last 7 days including today
        const days = [];
        const today = new Date(); // Browser time (User's "Today")

        for (let i = 6; i >= 0; i--) { // Reverse order: 6 days ago -> Today
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateString = d.toISOString().split('T')[0]; // YYYY-MM-DD

            // Find data for this date
            const existing = stats.mastered_activity.find((item: any) => item.date === dateString);

            days.push({
                date: dateString,
                mastered: existing ? existing.mastered : 0
            });
        }

        return days;
    }, [stats]);

    const masteryPercentage = useMemo(() => {
        if (!stats || stats.overview.total === 0) return 0;
        return Math.round((stats.overview.mastered / stats.overview.total) * 100);
    }, [stats]);

    const handleReviewClick = (type: string, label: string) => {
        setDrillType('review_status');
        setDrillValue(type);
        setDrillLabel(label);
    };

    // --- Mobile Tooltip Hook Instantiation ---
    const { handleTap, TooltipComponent } = useMobileTooltip();

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
            <TooltipComponent /> {/* Portal Tooltip */}

            {/* ROW 1: (1) Status Distribution & (8) Mastered Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. Status Distribution (Pie Chart) - Spans 1 col */}
                <div className={`${cardStyle} lg:col-span-1`}>
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Vocabulary Status</h3>
                        <p className="text-sm text-slate-500">Distribution by proficiency</p>
                    </div>
                    <div className="h-[220px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={85}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                    cornerRadius={4}
                                    isAnimationActive={true}
                                    animationDuration={1500}
                                    animationEasing="ease-out"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.1)',
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(4px)'
                                    }}
                                    itemStyle={{ color: '#1e293b', fontWeight: 600, fontSize: '13px' }}
                                    formatter={(value: any) => [`${value} words`, '']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text (Mastery Percentage) */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-500">
                            <span className="text-4xl font-black text-slate-900 tracking-tight">{masteryPercentage}%</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Mastered</span>
                        </div>
                    </div>
                    {/* Updated Legend */}
                    <div className="flex justify-center gap-4 mt-4">
                        {chartData.map((item) => (
                            <div key={item.name} className="flex flex-col items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.name}</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="font-bold text-slate-700 text-sm">{item.value}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Mastered Activity (Area Chart) - Spans 2 cols */}
                <div className={`${cardStyle} lg:col-span-2`}>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Learning Velocity</h3>
                            <p className="text-sm text-slate-500">Words mastered over time</p>
                        </div>
                        {/* Badge removed as requested */}

                    </div>
                    <div className="flex-1 w-full min-h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={processedMasteredActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="masteredGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#0A56C8" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="#0A56C8" stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                <XAxis dataKey="date" fontSize={11} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} dy={10} tickCount={7} />
                                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickCount={5} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    labelFormatter={(value) => new Date(value).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="mastered"
                                    stroke="#0A56C8"
                                    strokeWidth={3}
                                    fill="url(#masteredGradient)"
                                    activeDot={{ r: 6, strokeWidth: 2, fill: '#0A56C8', stroke: '#fff' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ROW 3: Heatmap & Improvement Zone */}
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">

                {/* Vocabulary Heatmap (Calendar Grid) - Spans 4 cols */}
                <div className={`${cardStyle} lg:col-span-4`}>
                    {/* MOBILE VERSION (High-Fidelity, Horizontal Scroll) */}
                    <div className="lg:hidden">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Vocabulary Heatmap</h3>
                                <p className="text-sm text-slate-500">2026 Consistency</p>
                            </div>
                            {/* Legend - Mobile */}
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                <span>Less</span>
                                <div className="w-2.5 h-2.5 bg-slate-100 rounded-[2px]" />
                                <div className="w-2.5 h-2.5 bg-[#93c5fd] rounded-[2px]" />
                                <div className="w-2.5 h-2.5 bg-[#3b82f6] rounded-[2px]" />
                                <div className="w-2.5 h-2.5 bg-[#1e3a8a] rounded-[2px]" />
                                <span>More</span>
                            </div>
                        </div>

                        {/* Scrollable Container */}
                        <div className="overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
                            <div className="min-w-[600px]">
                                {/* Days Header (1-31) */}
                                <div className="flex gap-1 mb-2 pl-12">
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                        <div key={day} className="flex-1 text-[9px] text-slate-300 font-medium text-center">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Month Rows */}
                                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, monthIdx) => {
                                    const daysInMonth = new Date(2026, monthIdx + 1, 0).getDate();
                                    return (
                                        <div key={month} className="flex items-center gap-1 mb-2">
                                            <div className="w-10 text-[11px] font-bold text-slate-700 shrink-0">
                                                {month}
                                            </div>
                                            {Array.from({ length: 31 }, (_, dayIdx) => {
                                                const day = dayIdx + 1;
                                                const isValidDay = day <= daysInMonth;
                                                const year = 2026;
                                                const dateString = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                                                const dayData = stats?.daily_heatmap?.find((d: any) => d.date === dateString);
                                                const count = dayData?.count || 0;

                                                // Monochromatic Blue Scale
                                                let colorClass = 'bg-slate-100';
                                                if (count > 0) {
                                                    if (count >= 10) colorClass = 'bg-[#1e3a8a]'; // Deep Royal
                                                    else if (count >= 5) colorClass = 'bg-[#2563eb]'; // Royal Blue
                                                    else if (count >= 3) colorClass = 'bg-[#60a5fa]'; // Lighter Blue
                                                    else colorClass = 'bg-[#dbeafe]'; // Very Light Blue
                                                }

                                                // Tooltip Content for this day
                                                const tooltipContent = (
                                                    <div className="text-center">
                                                        <div className="font-bold mb-1 text-blue-200">
                                                            {month} {day}, {year}
                                                        </div>
                                                        <div className="text-white font-black text-lg">
                                                            {count} <span className="text-xs font-normal text-slate-400">words</span>
                                                        </div>
                                                    </div>
                                                );

                                                return (
                                                    <div
                                                        key={dayIdx}
                                                        onClick={(e) => isValidDay && handleTap(e, tooltipContent)}
                                                        className={`flex-1 aspect-square rounded-[3px] ${isValidDay ? colorClass : 'bg-transparent'} ${isValidDay ? 'active:scale-90 transition-transform cursor-pointer' : ''}`}
                                                    />
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* DESKTOP VERSION (Original) */}
                    <div className="hidden lg:block">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Vocabulary Heatmap</h3>
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

            {/* ROW 4: Due for Review (Bento Grid Layout) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
                {/* Overdue: Spans 2 cols on mobile, 1 on desktop */}
                <div className="col-span-2 md:col-span-1 h-full">
                    <ReviewCard
                        label="Overdue"
                        value={stats.due_for_review.overdue}
                        color="rose"
                        icon={AlertCircle}
                        description="Review immediately"
                        onClick={() => handleReviewClick('overdue', 'Overdue Vocabulary')}
                    />
                </div>
                {/* Today: 1 col */}
                <div className="col-span-1 h-full">
                    <ReviewCard
                        label="Today"
                        value={stats.due_for_review.today}
                        color="amber"
                        icon={Calendar}
                        description="Keep streak"
                        onClick={() => handleReviewClick('today', 'Review Due Today')}
                    />
                </div>
                {/* Soon: 1 col */}
                <div className="col-span-1 h-full">
                    <ReviewCard
                        label="Soon"
                        value={stats.due_for_review.upcoming_7_days}
                        color="blue"
                        icon={Clock}
                        description="7 Days"
                        onClick={() => handleReviewClick('soon', 'Upcoming Reviews')}
                    />
                </div>
            </div>

            {/* Drill Down Modal */}
            {
                drillType && (
                    <DrillDownModal
                        type={drillType}
                        value={drillValue || ''}
                        label={drillLabel}
                        timezone={timezone}
                        onClose={() => setDrillType(null)}
                    />
                )
            }
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
    // High-Fidelity Color Palettes (Vibrant Text on White)
    const styles = {
        rose: {
            text: 'text-[#f43f5e]', // Vibrant Red
            bgIcon: 'bg-[#fff1f2]', // Very light red
            border: 'border-rose-100 hover:border-rose-200',
            glow: 'group-hover:shadow-[0_8px_20px_-4px_rgba(244,63,94,0.15)]'
        },
        amber: {
            text: 'text-[#f59e0b]', // Vibrant Amber
            bgIcon: 'bg-[#fffbeb]', // Very light amber
            border: 'border-amber-100 hover:border-amber-200',
            glow: 'group-hover:shadow-[0_8px_20px_-4px_rgba(245,158,11,0.15)]'
        },
        blue: {
            text: 'text-[#3b82f6]', // Vibrant Blue
            bgIcon: 'bg-[#eff6ff]', // Very light blue
            border: 'border-blue-100 hover:border-blue-200',
            glow: 'group-hover:shadow-[0_8px_20px_-4px_rgba(59,130,246,0.15)]'
        }
    };

    const s = styles[color];

    return (
        <div
            onClick={onClick}
            className={`
                relative overflow-hidden group cursor-pointer transition-all duration-300
                bg-white p-6 rounded-[24px] border border-transparent shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)]
                ${s.border} ${s.glow} hover:-translate-y-1 h-full flex flex-col justify-between
            `}
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-2xl ${s.bgIcon} ${s.text} transition-transform group-hover:scale-110`}>
                    <Icon size={20} strokeWidth={2.5} />
                </div>
                <div className={`text-4xl font-black tracking-tighter ${s.text}`}>
                    {value}
                </div>
            </div>

            <div>
                <div className={`text-[11px] font-bold uppercase tracking-widest opacity-90 mb-0.5 ${s.text}`}>
                    {label}
                </div>
                <div className="text-[10px] font-medium text-slate-400">
                    {description}
                </div>
            </div>
        </div>
    );
}
