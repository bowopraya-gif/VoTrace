'use client';

import { motion } from 'framer-motion';
import api from '@/lib/api';
import { StatsPeriod, PracticeStats, HardestWord } from '@/types/statistics';
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import ChartSkeleton from '../skeletons/ChartSkeleton';
import EmptyState from '../EmptyState';
import { Trophy, Target, Timer, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PracticeStatsSectionProps {
    stats: PracticeStats | undefined;
    isLoading: boolean;
    period: StatsPeriod;
    timezone: string;
}

const MODE_COLORS: Record<string, string> = {
    multiple_choice: '#3B82F6',
    typing: '#8B5CF6',
    listening: '#F97316',
    mixed: '#10B981',
};

const MODE_LABELS: Record<string, string> = {
    multiple_choice: 'Multiple Choice',
    typing: 'Typing',
    listening: 'Listening',
    mixed: 'Mixed',
};

const DIRECTION_LABELS: Record<string, string> = {
    en_to_id: 'English → Indonesian',
    id_to_en: 'Indonesian → English',
};

const PRIMARY_COLOR = '#0A56C8';

const cardStyle = "bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300";

export default function PracticeStatsSection({ stats, isLoading, period, timezone }: PracticeStatsSectionProps) {
    // Internal state removed - data controlled by parent

    if (isLoading || !stats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ChartSkeleton type="line" />
                <ChartSkeleton type="bar" />
                <ChartSkeleton type="heatmap" />
                <ChartSkeleton type="bar" />
            </div>
        );
    }

    if (!stats || stats.overview.sessions === 0) {
        return (
            <EmptyState
                title="No Practice Sessions Yet"
                message="Start your first session to unlock detailed performance analytics!"
                actionLabel="Start Practice"
                actionHref="/practice"
                emoji="🎯"
            />
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {/* Overview Stats Row - Only 4 Cards */}
            <div className="lg:col-span-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Sessions" value={stats.overview.sessions} icon={Zap} color="text-amber-500" bg="bg-amber-50" />
                <StatCard label="Questions" value={stats.overview.questions} icon={Target} color="text-blue-500" bg="bg-blue-50" />
                <StatCard label="Time (Mins)" value={stats.overview.time_mins} icon={Timer} color="text-indigo-500" bg="bg-indigo-50" />
                <StatCard label="Avg Accuracy" value={`${stats.overview.avg_accuracy}%`} icon={Trophy} color="text-emerald-500" bg="bg-emerald-50" />
            </div>

            {/* Accuracy Trend - Spans 3 cols - AREA CHART with Dynamic Scale */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${cardStyle} lg:col-span-3`}
            >
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Accuracy Trend</h3>
                    <p className="text-sm text-slate-500">Performance over time</p>
                </div>
                {stats.accuracy_trend.length > 0 ? (
                    (() => {
                        const accuracies = stats.accuracy_trend.map(d => d.accuracy);
                        const minAcc = Math.min(...accuracies);
                        const maxAcc = Math.max(...accuracies);
                        const dynamicMin = Math.max(0, Math.floor((minAcc - 10) / 10) * 10);
                        const dynamicMax = Math.min(100, Math.ceil((maxAcc + 5) / 10) * 10);

                        return (
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.accuracy_trend}>
                                        <defs>
                                            <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={PRIMARY_COLOR} stopOpacity={0.4} />
                                                <stop offset="100%" stopColor={PRIMARY_COLOR} stopOpacity={0.05} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                        <XAxis dataKey="date" fontSize={10} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                        <YAxis domain={[dynamicMin, dynamicMax]} tickFormatter={(v) => `${v}%`} fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} width={35} />
                                        <Tooltip
                                            formatter={(value) => [`${value}%`, 'Accuracy']}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="accuracy"
                                            stroke={PRIMARY_COLOR}
                                            strokeWidth={3}
                                            fill="url(#accuracyGradient)"
                                            dot={{ fill: PRIMARY_COLOR, strokeWidth: 2, r: 4, stroke: '#fff' }}
                                            activeDot={{ r: 6, strokeWidth: 0, fill: PRIMARY_COLOR }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        );
                    })()
                ) : (
                    <div className="h-48 flex items-center justify-center text-slate-400">No data available</div>
                )}
            </motion.div>

            {/* Mode Performance - Spans 3 cols */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`${cardStyle} lg:col-span-3`}
            >
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">By Mode</h3>
                    <p className="text-sm text-slate-500">Accuracy per practice type</p>
                </div>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.by_mode} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={10} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="mode" width={110} fontSize={10} tickFormatter={(v) => MODE_LABELS[v] || v} axisLine={false} tickLine={false} />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-sm">
                                                <div className="font-bold">{MODE_LABELS[data.mode] || data.mode}</div>
                                                <div className="text-slate-300">{data.accuracy}% accuracy</div>
                                                <div className="text-slate-400 text-xs mt-1">{data.sessions} sessions</div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="accuracy" radius={[0, 6, 6, 0]} barSize={20}>
                                {stats.by_mode.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={MODE_COLORS[entry.mode] || '#94A3B8'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Row 2: Hardest Words (2 cols) + Activity Heatmap (4 cols) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`${cardStyle} lg:col-span-2`}
            >
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Hardest Words</h3>
                    <p className="text-sm text-slate-500">Words that need more practice</p>
                </div>
                {stats.hardest_words.length > 0 ? (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                        {stats.hardest_words.map((word) => (
                            <HardestWordCard key={word.id} word={word} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <span className="text-3xl mb-2">🎉</span>
                        <p className="text-slate-500 font-medium">Great job! No hard words found</p>
                        <p className="text-slate-400 text-sm mt-1">Keep practicing to stay sharp!</p>
                    </div>
                )}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className={`${cardStyle} lg:col-span-4`}
            >
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Activity Heatmap</h3>
                        <p className="text-sm text-slate-500">2026 Practice Consistency</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Less</span>
                        <div className="flex gap-0.5">
                            <div className="w-3 h-3 rounded-sm bg-slate-100"></div>
                            <div className="w-3 h-3 rounded-sm bg-[#0A56C8]/30"></div>
                            <div className="w-3 h-3 rounded-sm bg-[#0A56C8]/60"></div>
                            <div className="w-3 h-3 rounded-sm bg-[#0A56C8]"></div>
                        </div>
                        <span>More</span>
                    </div>
                </div>
                <YearlyHeatmap data={stats.weekly_heatmap} year={2026} />
            </motion.div>

            {/* Bi-Directional Balance Meter - Spans 6 cols (Full Width) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`${cardStyle} lg:col-span-6`}
            >
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Skill Balance</h3>
                    <p className="text-sm text-slate-500">How balanced is your passive vs active translation?</p>
                </div>
                {stats.direction_performance.length > 0 ? (
                    <BalanceMeter data={stats.direction_performance} />
                ) : (
                    <p className="text-slate-400 text-center py-8">No data</p>
                )}
            </motion.div>

            {/* Recent Sessions - Spans 6 cols (Full Width) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className={`${cardStyle} lg:col-span-6`}
            >
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent Sessions</h3>
                    <p className="text-sm text-slate-500">Latest activity log</p>
                </div>
                {stats.recent_sessions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {stats.recent_sessions.map((session) => (
                            <a
                                key={session.id}
                                href={`/practice/result/${session.id}`}
                                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`
                                        w-8 h-8 rounded-lg flex items-center justify-center
                                        ${session.accuracy >= 80 ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}
                                    `}>
                                        <Zap size={14} fill="currentColor" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                                            {session.mode.replace('_', ' ')}
                                        </div>
                                        <div className="text-sm text-slate-400">
                                            {new Date(session.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-bold ${session.accuracy >= 80 ? 'text-green-600' : session.accuracy >= 60 ? 'text-amber-600' : 'text-slate-600'}`}>
                                        {session.accuracy}%
                                    </div>
                                    <div className="text-xs text-slate-400 font-medium">
                                        {Math.floor(session.duration / 60)}m {session.duration % 60}s
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400 text-center py-8">No recent sessions</p>
                )}
            </motion.div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, bg }: { label: string; value: string | number; icon: any; color: string; bg: string }) {
    return (
        <div className={`flex flex-col items-center justify-center p-4 rounded-3xl ${bg} border border-transparent hover:border-black/5 transition-all duration-300`}>
            <Icon size={20} className={`${color} mb-2 opacity-80`} />
            <div className={`text-2xl font-black tracking-tight ${color}`}>{value}</div>
            <div className={`text-[10px] font-bold uppercase tracking-wide opacity-60 ${color}`}>{label}</div>
        </div>
    );
}

function HardestWordCard({ word }: { word: HardestWord }) {
    // 🎨 Color Palette based on accuracy
    const getColor = (acc: number) => {
        if (acc < 40) return {
            bg: 'bg-gradient-to-br from-rose-50 to-white',
            border: 'border-rose-100',
            bar: 'bg-rose-500',
            text: 'text-rose-600',
            badge: 'bg-rose-100 text-rose-700'
        };
        if (acc < 60) return {
            bg: 'bg-gradient-to-br from-amber-50 to-white',
            border: 'border-amber-100',
            bar: 'bg-amber-500',
            text: 'text-amber-600',
            badge: 'bg-amber-100 text-amber-700'
        };
        return {
            bg: 'bg-gradient-to-br from-orange-50 to-white',
            border: 'border-orange-100',
            bar: 'bg-orange-500',
            text: 'text-orange-600',
            badge: 'bg-orange-100 text-orange-700'
        };
    };

    const colors = getColor(word.accuracy);
    const accuracy = Math.round(word.accuracy); // Round to no decimals

    return (
        <div className={`group relative p-4 rounded-2xl border ${colors.border} ${colors.bg} hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300`}>
            {/* Top Row: Word Info & Accuracy Badge */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-slate-800 text-base truncate tracking-tight">{word.english_word}</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-500 uppercase rounded tracking-wider">{word.part_of_speech}</span>
                    </div>
                    <div className="text-sm text-slate-500 truncate font-medium">{word.translation}</div>
                </div>

                <div className={`flex flex-col items-end`}>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${colors.badge}`}>
                        <Target size={12} strokeWidth={3} />
                        <span className="text-xs font-black tracking-tight">{accuracy}%</span>
                    </div>
                    <div className="text-[10px] font-semibold text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {word.correct} / {word.total_attempts} cor.
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`absolute inset-y-0 left-0 rounded-full ${colors.bar} transition-all duration-1000 ease-out`}
                    style={{ width: `${accuracy}%` }}
                />
            </div>
        </div>
    );
}

function YearlyHeatmap({ data, year }: { data: { day: number; week: number; count: number; date: string }[], year: number }) {
    // Convert weekly data to date map
    const dataMap = new Map<string, number>();
    data.forEach(item => {
        if (item.date) {
            dataMap.set(item.date, item.count);
        }
    });

    const getColor = (count: number) => {
        if (count === 0) return 'bg-slate-100';
        if (count <= 1) return 'bg-[#0A56C8]/30';
        if (count <= 3) return 'bg-[#0A56C8]/50';
        if (count <= 5) return 'bg-[#0A56C8]/70';
        if (count <= 8) return 'bg-[#0A56C8]/90';
        return 'bg-[#0A56C8]';
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

    return (
        <div className="w-full">
            {/* Day headers (1-31) */}
            <div className="flex gap-1 mb-1 pl-10">
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <div key={day} className="w-4 text-[8px] text-slate-400 text-center font-medium">
                        {day}
                    </div>
                ))}
            </div>

            {/* Month rows */}
            {months.map((month, monthIndex) => (
                <div key={month.name} className="flex gap-1 mb-1 items-center">
                    <div className="w-8 text-[10px] text-slate-500 font-semibold">{month.name}</div>
                    {Array.from({ length: 31 }, (_, dayIndex) => {
                        const day = dayIndex + 1;
                        const isValidDay = day <= month.days;
                        const dateStr = isValidDay
                            ? `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                            : null;
                        const count = dateStr ? (dataMap.get(dateStr) || 0) : 0;

                        return (
                            <div
                                key={dayIndex}
                                className={`w-4 h-4 rounded-[3px] ${isValidDay ? getColor(count) : 'bg-transparent'} 
                                    ${isValidDay ? 'hover:ring-2 hover:ring-slate-400/50 cursor-default' : ''} 
                                    transition-all relative group`}
                            >
                                {isValidDay && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                        <div className="bg-slate-900 text-white text-[10px] px-2 py-1.5 rounded-md shadow-xl whitespace-nowrap">
                                            <div className="font-bold">{count} sessions</div>
                                            <div className="text-slate-300 font-medium">{month.name} {day}, {year}</div>
                                        </div>
                                        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-900 absolute left-1/2 -translate-x-1/2 top-full"></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

function BalanceMeter({ data }: { data: { direction: string; accuracy: number }[] }) {
    // Find EN→ID and ID→EN accuracies
    const enToId = data.find(d => d.direction === 'en_to_id')?.accuracy || 50;
    const idToEn = data.find(d => d.direction === 'id_to_en')?.accuracy || 50;

    // Calculate balance: -50 to +50 range (center = 0)
    // Positive = stronger at ID→EN (active recall)
    // Negative = stronger at EN→ID (passive recognition)
    const balance = ((idToEn - enToId) / 2);
    const markerPosition = 50 + balance; // 0-100% position

    // Determine balance status
    const getBalanceStatus = () => {
        const diff = Math.abs(balance);
        if (diff <= 5) return { label: 'Perfectly Balanced', color: 'text-emerald-600', emoji: '' };
        if (diff <= 15) return { label: 'Slightly Unbalanced', color: 'text-amber-600', emoji: '' };
        return { label: 'Needs Attention', color: 'text-rose-600', emoji: '⚠️' };
    };

    const status = getBalanceStatus();

    return (
        <div className="space-y-6">
            {/* Balance Bar */}
            <div className="relative">
                {/* Track with gradient and glow */}
                <div
                    className="h-4 rounded-full relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(to right, #3B82F6, #6366F1, #8B5CF6)',
                        boxShadow: '0 0 20px rgba(99, 102, 241, 0.4), inset 0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    {/* Center line marker */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/60 transform -translate-x-1/2 z-10" />

                    {/* Glow overlay */}
                    <div
                        className="absolute inset-0 opacity-50"
                        style={{
                            background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)'
                        }}
                    />
                </div>

                {/* Animated Marker/Needle */}
                <motion.div
                    initial={{ left: '50%' }}
                    animate={{ left: `${markerPosition}%` }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
                    style={{ top: '50%' }}
                >
                    {/* Marker glow */}
                    <div
                        className="absolute inset-0 w-6 h-6 rounded-full blur-md"
                        style={{ background: 'rgba(255,255,255,0.8)' }}
                    />
                    {/* Marker core */}
                    <div
                        className="relative w-6 h-6 rounded-full border-4 border-white shadow-lg flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.5)'
                        }}
                    >
                        <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                </motion.div>
            </div>

            {/* Labels */}
            <div className="flex justify-between items-start text-sm">
                <div className="text-left">
                    <div className="flex items-center gap-1.5 text-blue-600 font-bold">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        EN → ID
                    </div>
                    <div className="text-2xl font-black text-slate-900">{enToId}%</div>
                    <div className="text-xs text-slate-500 font-medium">Passive Recognition</div>
                </div>

                <div className="text-center flex-1">
                    <div className={`text-lg font-bold ${status.color}`}>
                        {status.emoji} {status.label}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                        {balance > 0 ? `+${balance.toFixed(0)}` : balance.toFixed(0)} balance
                    </div>
                </div>

                <div className="text-right">
                    <div className="flex items-center gap-1.5 text-violet-600 font-bold justify-end">
                        ID → EN
                        <span className="w-2 h-2 rounded-full bg-violet-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">{idToEn}%</div>
                    <div className="text-xs text-slate-500 font-medium">Active Recall</div>
                </div>
            </div>
        </div>
    );
}
