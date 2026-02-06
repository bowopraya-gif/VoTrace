'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueries } from '@tanstack/react-query';
import api from '@/lib/api';
import { StatsPeriod } from '@/types/statistics';
import { useAuthStore } from '@/stores/authStore';
import OverviewStatsCards from '@/components/statistics/OverviewStatsCards';
import PeriodSelector from '@/components/statistics/PeriodSelector';
import VocabularyStatsSection from '@/components/statistics/vocabulary/VocabularyStatsSection';
import PracticeStatsSection from '@/components/statistics/practice/PracticeStatsSection';
import LearningStatsSection from '@/components/statistics/learning/LearningStatsSection';

type TabType = 'vocabulary' | 'practice' | 'learning';

const TABS: { value: TabType; label: string }[] = [
    { value: 'vocabulary', label: 'Vocabulary' },
    { value: 'practice', label: 'Practice' },
    { value: 'learning', label: 'Learning' },
];

export default function StatisticsPage() {
    const { user } = useAuthStore();
    const [period, setPeriod] = useState<StatsPeriod>('all');
    const [activeTab, setActiveTab] = useState<TabType>('vocabulary');

    // Personalize Title Logic
    const displayName = user?.full_name || user?.username || '';
    const firstName = displayName ? displayName.split(' ')[0] : 'Your';
    const possessiveSuffix = firstName.toLowerCase().endsWith('s') ? "'" : "'s";
    // If name is "Your" (default/loading), don't add suffix. "Your Progress" is correct.
    const title = displayName ? `${firstName}${possessiveSuffix} Progress` : 'Your Progress';

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // 🚀 Parallel Fetching: Calls all endpoints simultaneously
    // This allows Overview to load fast (~100ms) while heavier charts load slightly later (~1s)
    const [overviewQuery, vocabularyQuery, practiceQuery, learningQuery] = useQueries({
        queries: [
            {
                queryKey: ['statistics', 'overview', timezone],
                queryFn: () => api.get('/statistics/overview', { params: { tz: timezone } }).then(r => r.data),
                staleTime: 5 * 60 * 1000,
            },
            {
                queryKey: ['statistics', 'vocabulary', period, timezone],
                queryFn: () => api.get('/statistics/vocabulary', { params: { period, tz: timezone } }).then(r => r.data),
                staleTime: 5 * 60 * 1000,
            },
            {
                queryKey: ['statistics', 'practice', period, timezone],
                queryFn: () => api.get('/statistics/practice', { params: { period, tz: timezone } }).then(r => r.data),
                staleTime: 5 * 60 * 1000,
            },
            {
                queryKey: ['statistics', 'learning', period, timezone],
                queryFn: () => api.get('/statistics/learning', { params: { period, tz: timezone } }).then(r => r.data),
                staleTime: 5 * 60 * 1000,
            },
        ],
    });

    return (
        <div className="max-w-7xl mx-auto min-h-screen bg-[#F8FAFC] py-6 md:p-6 lg:p-10 space-y-6 md:space-y-10 animate-in fade-in zoom-in-95 duration-700">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 md:gap-6">
                <div className="space-y-1 md:space-y-2">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight"
                    >
                        {title}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="text-sm md:text-lg text-slate-500 max-w-xl"
                    >
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <PeriodSelector value={period} onChange={setPeriod} />
                </motion.div>
            </div>

            {/* Overview Bento Grid - Loads instantly! */}
            <OverviewStatsCards
                overview={overviewQuery.data}
                loading={overviewQuery.isLoading}
            />

            {/* Tabs & Content */}
            <div className="space-y-6">
                {/* Modern Pill Tabs */}
                {/* Modern Pill Tabs */}
                <div className="flex justify-center md:justify-start">
                    <div className="flex w-full md:w-auto md:inline-flex bg-white p-1 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.04)]">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.value;
                            return (
                                <button
                                    key={tab.value}
                                    onClick={() => setActiveTab(tab.value)}
                                    className={`
                                        relative flex-1 md:flex-none px-3 py-2.5 md:px-6 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all duration-300
                                        ${isActive ? 'text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
                                    `}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="pill-tab"
                                            className="absolute inset-0 bg-blue-600 rounded-xl"
                                            transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center justify-center gap-1.5 md:gap-2">
                                        <span>{tab.label}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Staggered Content Area */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        {activeTab === 'vocabulary' && (
                            <VocabularyStatsSection
                                stats={vocabularyQuery.data}
                                isLoading={vocabularyQuery.isLoading}
                                period={period}
                                timezone={timezone}
                            />
                        )}
                        {activeTab === 'practice' && (
                            <PracticeStatsSection
                                stats={practiceQuery.data}
                                isLoading={practiceQuery.isLoading}
                                period={period}
                                timezone={timezone}
                            />
                        )}
                        {activeTab === 'learning' && (
                            <LearningStatsSection
                                stats={learningQuery.data}
                                isLoading={learningQuery.isLoading}
                                period={period}
                                timezone={timezone}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
