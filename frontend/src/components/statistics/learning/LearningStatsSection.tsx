'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { StatsPeriod, LearningStats } from '@/types/statistics';
import {
    AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import ChartSkeleton from '../skeletons/ChartSkeleton';
import EmptyState from '../EmptyState';
import { BookOpen, CheckCircle, Clock } from 'lucide-react';

interface LearningStatsSectionProps {
    stats: LearningStats | undefined;
    isLoading: boolean;
    period: StatsPeriod;
    timezone: string;
}

const cardStyle = "bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300";

import { useMobileTooltip } from '@/hooks/useMobileTooltip'; // Add import

export default function LearningStatsSection({ stats, isLoading, period, timezone }: LearningStatsSectionProps) {
    const router = useRouter();
    // Internal state removed - data controlled by parent

    // --- Mobile Tooltip Hook ---
    const { handleTap, TooltipComponent } = useMobileTooltip();

    if (isLoading || !stats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                <ChartSkeleton type="bar" />
                <ChartSkeleton type="line" />
                <ChartSkeleton type="bar" />
                <ChartSkeleton type="bar" />
            </div>
        );
    }

    if (!stats || stats.overview.lessons_completed === 0) {
        return (
            <EmptyState
                title="No Learning Progress Yet"
                message="Start your first lesson to track your journey!"
                actionLabel="Start Learning"
                actionHref="/learning"
                emoji="📖"
            />
        );
    }

    // Theme logic for Quiz Accuracy
    const accuracy = Math.round(stats.quiz_performance.accuracy);
    const theme = (() => {
        if (accuracy >= 80) return { color: 'text-emerald-600', subColor: 'text-emerald-500', stroke: '#10B981', bg: 'bg-emerald-50', border: 'border-emerald-100', shadow: 'shadow-emerald-100', label: 'Excellent' };
        if (accuracy >= 60) return { color: 'text-blue-600', subColor: 'text-blue-500', stroke: '#3B82F6', bg: 'bg-blue-50', border: 'border-blue-100', shadow: 'shadow-blue-100', label: 'Good' };
        return { color: 'text-rose-600', subColor: 'text-rose-500', stroke: '#F43F5E', bg: 'bg-rose-50', border: 'border-rose-100', shadow: 'shadow-rose-100', label: 'Needs Practice' };
    })();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            <TooltipComponent /> {/* Portal Tooltip */}
            {/* Overview Stats Row */}
            <div className="lg:col-span-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Modules" value={stats.overview.modules_started} icon={BookOpen} color="text-blue-500" bg="bg-blue-50" />
                <StatCard label="Lessons" value={stats.overview.lessons_completed} icon={CheckCircle} color="text-emerald-500" bg="bg-emerald-50" />
                <StatCard label="In Progress" value={stats.overview.lessons_in_progress} icon={Clock} color="text-amber-500" bg="bg-amber-50" />
                <StatCard label="Study Hours" value={`${stats.overview.hours}h`} icon={Clock} color="text-violet-500" bg="bg-violet-50" />
            </div>

            {/* Module Progress - Spans 3 cols */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${cardStyle} lg:col-span-3`}
            >
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Module Progress</h3>
                    <p className="text-sm text-slate-500">Completion status</p>
                </div>
                {stats.progress_by_module.length > 0 ? (
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {stats.progress_by_module.map((module) => {
                            const isCompleted = module.percent === 100;
                            return (
                                <div
                                    key={module.id}
                                    className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer group relative overflow-hidden
                                        ${isCompleted ? 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50' : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-blue-50/30'}
                                    `}
                                    onClick={() => router.push(`/learning/modules/${module.slug}`)}
                                >
                                    {/* Icon & Title */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className={`p-2.5 rounded-xl shrink-0 ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {isCompleted ? <CheckCircle size={20} strokeWidth={2.5} /> : <BookOpen size={20} strokeWidth={2.5} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <h4 className={`font-bold text-sm truncate ${isCompleted ? 'text-emerald-900' : 'text-slate-700 group-hover:text-blue-700 transition-colors'}`}>
                                                    {module.title}
                                                </h4>
                                                {isCompleted && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full uppercase tracking-wide shrink-0">
                                                        Mastered
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-xs font-semibold ${isCompleted ? 'text-emerald-600/80' : 'text-slate-500'}`}>
                                                    {module.completed}/{module.total} lessons
                                                </span>
                                                {module.score > 0 && (
                                                    <>
                                                        <span className="text-slate-300 text-[10px]">•</span>
                                                        <span className={`text-xs font-bold ${isCompleted ? 'text-emerald-600' : 'text-orange-500'}`}>
                                                            {module.score}% Score
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="flex items-center gap-3">
                                        <div className={`flex-1 h-2 rounded-full overflow-hidden ${isCompleted ? 'bg-emerald-200' : 'bg-slate-100'}`}>
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                style={{ width: `${module.percent}%` }}
                                            />
                                        </div>
                                        <span className={`text-xs font-bold w-9 text-right ${isCompleted ? 'text-emerald-600' : 'text-slate-600'}`}>
                                            {module.percent}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-slate-400 text-center py-16">No module progress yet</p>
                )}
            </motion.div>

            {/* Quiz Performance - Spans 3 cols */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`${cardStyle} lg:col-span-3 overflow-hidden relative`}
            >
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Quiz Accuracy</h3>
                        <p className="text-sm text-slate-500">Performance Overview</p>
                    </div>
                    {/* Badge */}
                    <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${theme.bg} ${theme.color} ${theme.border}`}>
                        {theme.label}
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center relative z-10">
                    <div className="relative w-52 h-52 mb-6">
                        {/* Glow effect */}
                        <div className={`absolute inset-4 rounded-full blur-xl opacity-20 ${theme.bg.replace('bg-', 'bg-')}`}></div>

                        <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
                            {/* Track */}
                            <circle
                                cx="50" cy="50" r="42"
                                fill="none"
                                stroke="#F1F5F9"
                                strokeWidth="6"
                                strokeLinecap="round"
                            />
                            {/* Progress */}
                            <circle
                                cx="50" cy="50" r="42"
                                fill="none"
                                stroke={theme.stroke}
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={`${(accuracy / 100) * 264} 264`}
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-6xl font-black tracking-tighter ${theme.color}`}>
                                {accuracy}<span className="text-3xl align-top opacity-60">%</span>
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full">
                        <div className={`text-center p-4 rounded-2xl border transition-colors duration-300 ${theme.bg} ${theme.border}`}>
                            <div className={`text-2xl font-black ${theme.color}`}>{stats.quiz_performance.correct}</div>
                            <div className={`text-[10px] font-bold uppercase tracking-wider opacity-70 ${theme.color}`}>Correct</div>
                        </div>
                        <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                            <div className="text-2xl font-black text-slate-700">{stats.quiz_performance.total}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Questions</div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Weekly Learning Activity - Spans 2 cols */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`${cardStyle} lg:col-span-2 flex flex-col`}
            >
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Weekly Activity</h3>
                        <p className="text-sm text-slate-500">{stats.daily_activity.week_label}</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-blue-600 mr-2">
                            {stats.daily_activity.total_minutes} min total
                        </span>
                    </div>
                </div>
                <div className="flex-1 w-full min-h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.daily_activity.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                            <XAxis dataKey="day" fontSize={11} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                            <YAxis fontSize={10} tickFormatter={(v) => `${v}m`} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickCount={7} />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-sm border border-slate-700/50 backdrop-blur-sm">
                                                <div className="font-bold mb-1 text-blue-200">{data.day}, {new Date(data.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                                                <div className="text-white font-black text-lg">{data.minutes} <span className="text-xs font-normal text-slate-400">min</span></div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="minutes"
                                stroke="#3B82F6"
                                strokeWidth={3}
                                fill="url(#activityGradient)"
                                activeDot={{ r: 6, strokeWidth: 2, fill: '#3B82F6', stroke: '#fff' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Activity Heatmap - Spans 4 cols */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`${cardStyle} lg:col-span-4 overflow-hidden`}
            >
                {/* MOBILE VERSION (High-Fidelity, Consistent Design) */}
                <div className="lg:hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Activity Heatmap</h3>
                            <p className="text-sm text-slate-500">Learning consistency</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <span>Less</span>
                            <div className="w-2.5 h-2.5 bg-slate-100 rounded-[2px]" />
                            <div className="w-2.5 h-2.5 bg-[#93c5fd] rounded-[2px]" />
                            <div className="w-2.5 h-2.5 bg-[#3b82f6] rounded-[2px]" />
                            <div className="w-2.5 h-2.5 bg-[#1e3a8a] rounded-[2px]" />
                            <span>More</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
                        <div className="min-w-[600px]">
                            {/* Days Header */}
                            <div className="flex gap-1 mb-2 pl-12">
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                    <div key={day} className="flex-1 text-[9px] text-slate-300 font-medium text-center">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Month Rows */}
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, monthIdx) => {
                                const daysInMonth = new Date(new Date().getFullYear(), monthIdx + 1, 0).getDate();
                                return (
                                    <div key={month} className="flex items-center gap-1 mb-2">
                                        <div className="w-10 text-[11px] font-bold text-slate-700 shrink-0">
                                            {month}
                                        </div>
                                        {Array.from({ length: 31 }, (_, dayIdx) => {
                                            const day = dayIdx + 1;
                                            const isValidDay = day <= daysInMonth;
                                            const year = new Date().getFullYear();
                                            const dateString = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                                            // Learning stats uses 'minutes'
                                            const dayData = stats.activity_heatmap?.find((d: any) => d.date === dateString);
                                            const minutes = dayData?.minutes || 0;
                                            const count = dayData?.count || 0;

                                            let colorClass = 'bg-slate-100';
                                            if (minutes > 0) {
                                                if (minutes >= 60) colorClass = 'bg-[#1e3a8a]';
                                                else if (minutes >= 30) colorClass = 'bg-[#2563eb]';
                                                else if (minutes >= 15) colorClass = 'bg-[#60a5fa]';
                                                else colorClass = 'bg-[#dbeafe]';
                                            }

                                            // Tooltip Content
                                            const tooltipContent = (
                                                <div className="text-center">
                                                    <div className="font-bold mb-1 text-blue-200">
                                                        {month} {day}, {year}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <div className="text-white font-black text-lg">
                                                            {minutes} <span className="text-xs font-normal text-slate-400">min</span>
                                                        </div>
                                                        {count > 0 && (
                                                            <div className="text-xs text-slate-400 font-medium">
                                                                {count} sessions
                                                            </div>
                                                        )}
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
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Activity Heatmap</h3>
                            <p className="text-sm text-slate-500">Learning consistency</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium pt-1">
                            <span>Less</span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 rounded-[2px] bg-slate-100"></div>
                                <div className="w-3 h-3 rounded-[2px] bg-blue-200"></div>
                                <div className="w-3 h-3 rounded-[2px] bg-blue-300"></div>
                                <div className="w-3 h-3 rounded-[2px] bg-blue-400"></div>
                                <div className="w-3 h-3 rounded-[2px] bg-blue-500"></div>
                                <div className="w-3 h-3 rounded-[2px] bg-blue-600"></div>
                            </div>
                            <span>More</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto pb-2 custom-scrollbar">
                        <YearlyHeatmap data={stats.activity_heatmap} year={new Date().getFullYear()} />
                    </div>
                </div>
            </motion.div>

            {/* Recent Lessons - Spans 6 cols (Full Width) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={`${cardStyle} lg:col-span-6`}
            >
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent Activity</h3>
                    <p className="text-sm text-slate-500">History log</p>
                </div>
                {stats.recent_lessons.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.recent_lessons.map((lesson, i) => (
                            <div key={i} className="group flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all cursor-default relative overflow-hidden">
                                <div className={`p-2.5 rounded-xl transition-colors shrink-0 ${lesson.status === 'in_progress' ? 'bg-amber-50 text-amber-500 group-hover:bg-amber-100 group-hover:text-amber-600' :
                                    lesson.has_quiz ? 'bg-blue-50 text-blue-500 group-hover:bg-blue-100 group-hover:text-blue-600' :
                                        'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-500'
                                    }`}>
                                    {lesson.status === 'in_progress' ? <Clock size={18} strokeWidth={2.5} /> :
                                        lesson.has_quiz ? <CheckCircle size={18} strokeWidth={2.5} /> : <BookOpen size={18} strokeWidth={2.5} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-700 text-sm truncate group-hover:text-blue-700 transition-colors">{lesson.title}</h4>
                                    <p className="text-xs text-slate-500 truncate">{lesson.module}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {lesson.status === 'in_progress' ? (
                                        <div className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                                            {lesson.progress}%
                                        </div>
                                    ) : lesson.has_quiz && lesson.score > 0 ? (
                                        <div className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${lesson.score >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            lesson.score >= 60 ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                'bg-rose-50 text-rose-600 border-rose-100'
                                            }`}>
                                            {lesson.score}%
                                        </div>
                                    ) : (
                                        <div className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-500 uppercase tracking-wider border border-slate-200">
                                            Completed
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                                        <Clock size={10} />
                                        {lesson.date ? new Date(lesson.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400 text-center py-8">No completed lessons yet</p>
                )}
            </motion.div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, bg }: { label: string; value: string | number; icon: any; color: string; bg: string }) {
    return (
        <div className={`flex flex-col items-center justify-center p-4 rounded-3xl ${bg} border border-transparent hover:border-black/5 transition-all duration-300 group`}>
            <Icon size={20} className={`${color} mb-2 opacity-80 group-hover:scale-110 transition-transform`} />
            <div className={`text-2xl font-black tracking-tight ${color}`}>{value}</div>
            <div className={`text-[10px] font-bold uppercase tracking-wide opacity-60 ${color}`}>{label}</div>
        </div>
    );
}

function YearlyHeatmap({ data = [], year }: { data?: { day: number; week: number; count: number; minutes: number; date: string }[], year: number }) {
    // Tooltip State
    const [tooltip, setTooltip] = useState<{ x: number; y: number; data: any } | null>(null);

    // Convert data to map
    const dataMap = new Map<string, { count: number; minutes: number }>();
    (data || []).forEach(item => {
        if (item.date) {
            dataMap.set(item.date, { count: item.count, minutes: item.minutes });
        }
    });

    // 🔵 Blue theme (Primary) based on MINUTES
    const getColor = (minutes: number) => {
        if (minutes === 0) return 'bg-slate-100';
        if (minutes <= 15) return 'bg-blue-200';
        if (minutes <= 30) return 'bg-blue-300';
        if (minutes <= 45) return 'bg-blue-400';
        if (minutes <= 60) return 'bg-blue-500';
        return 'bg-blue-600';
    };

    const months = [
        { name: 'Jan', days: 31 },
        { name: 'Feb', days: year % 4 === 0 ? 29 : 28 },
        { name: 'Mar', days: 31 },
        { name: 'Apr', days: 30 },
        { name: 'May', days: 31 },
        { name: 'Jun', days: 30 },
        { name: 'Jul', days: 31 },
        { name: 'Aug', days: 31 },
        { name: 'Sep', days: 30 },
        { name: 'Oct', days: 31 },
        { name: 'Nov', days: 30 },
        { name: 'Dec', days: 31 },
    ];

    const handleMouseEnter = (e: React.MouseEvent, dayData: any) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
            data: dayData
        });
    };

    return (
        <div className="w-full min-w-[700px] relative">
            {/* Header: Legend & Day Labels */}
            {/* Legend removed from here and moved to parent card header */}

            {/* Day headers (1-31) */}
            <div className="flex gap-1 mb-2 pl-12">
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <div key={day} className="w-4 text-[9px] text-slate-400 text-center font-semibold">
                        {day}
                    </div>
                ))}
            </div>

            {/* Month rows */}
            {months.map((month, monthIndex) => (
                <div key={month.name} className="flex gap-1 mb-1.5 items-center">
                    {/* Month Label: Title Case (removed uppercase) */}
                    <div className="w-10 text-[11px] text-slate-500 font-bold">{month.name}</div>
                    {Array.from({ length: 31 }, (_, dayIndex) => {
                        const day = dayIndex + 1;
                        const isValidDay = day <= month.days;
                        const dateStr = isValidDay
                            ? `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                            : null;

                        const entry = dateStr ? dataMap.get(dateStr) : null;
                        const minutes = entry?.minutes || 0;
                        const count = entry?.count || 0;

                        return (
                            <div
                                key={dayIndex}
                                className={`w-4 h-4 rounded-[3px] ${isValidDay ? getColor(minutes) : 'bg-transparent'}
                                    ${isValidDay ? 'hover:ring-2 hover:ring-blue-400/50 cursor-pointer transition-all duration-200' : ''}
                                    ${isValidDay && minutes > 0 ? 'hover:scale-110 shadow-sm' : ''}
                                `}
                                onMouseEnter={(e) => isValidDay && handleMouseEnter(e, { date: dateStr, minutes, count })}
                                onMouseLeave={() => setTooltip(null)}
                            />
                        );
                    })}
                </div>
            ))}

            {/* Custom Tooltip Portal */}
            {tooltip && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed z-[9999] pointer-events-none transform -translate-x-1/2 -translate-y-full px-3 py-2 bg-slate-900/95 text-white text-xs rounded-lg shadow-xl border border-slate-700/50 backdrop-blur-sm transition-opacity duration-200"
                    style={{ left: tooltip.x, top: tooltip.y - 8 }}
                >
                    <div className="font-bold mb-1 text-blue-200">
                        {new Date(tooltip.data.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="space-y-0.5">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-slate-400">Duration:</span>
                            <span className="font-mono font-bold">{tooltip.data.minutes} min</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-slate-400">Lessons:</span>
                            <span className="font-mono font-bold">{tooltip.data.count}</span>
                        </div>
                    </div>
                    {/* Arrow */}
                    <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900/95"></div>
                </div>,
                document.body
            )}
        </div>
    );
}
