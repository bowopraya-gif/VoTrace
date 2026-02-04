'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { Module, LearningStats, LearningActivityItem } from '@/types/learning';
import ModuleCard from '@/components/learning/ModuleCard';
import ModuleSkeleton from '@/components/learning/ModuleSkeleton';
import LearningStatsCards from '@/components/learning/LearningStatsCards';
import LearningActivityTable from '@/components/learning/LearningActivityTable';
import QueryErrorState from '@/components/ui/QueryErrorState';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, SlidersHorizontal, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

export default function LearningDashboard() {
    // Filters
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 300); // 300ms Debounce
    const [sort, setSort] = useState('newest'); // Default to sorting by Newest

    // 1. Stats Query
    const { data: stats } = useQuery({
        queryKey: ['learning', 'stats'],
        queryFn: () => api.get('/learning/stats').then(res => res.data),
        staleTime: 5 * 60 * 1000,
    });

    // 2. Activity Query
    const { data: activity = [], isLoading: activityLoading } = useQuery({
        queryKey: ['learning', 'history'],
        queryFn: () => api.get('/learning/history').then(res => res.data),
        staleTime: 1 * 60 * 1000,
    });

    // 3. Modules Query
    const {
        data: modulesData,
        isLoading: modulesLoading,
        isFetching: isfetchingModules,
        error: modulesError,
        refetch: refetchModules
    } = useQuery({
        queryKey: ['learning', 'modules', { search: debouncedSearch, sort }],
        queryFn: () => api.get('/learning/modules', {
            params: {
                search: debouncedSearch,
                sort
            }
        }).then(res => res.data),
        placeholderData: (prev) => prev, // Keep previous data while fetching (no flickering)
    });

    const modules = modulesData?.data ?? [];
    const loading = modulesLoading;
    const searching = isfetchingModules && !modulesLoading; // Show subtle loading if refetching

    // Active Filters Helper
    const hasActiveFilters = debouncedSearch.length > 0 || sort !== 'newest';
    const clearFilters = () => {
        setSearch('');
        setSort('newest');
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Page Header & Stats */}
            <div className="space-y-6">
                <LearningStatsCards stats={stats} />
            </div>

            {/* Controls (Search & Sort) */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md py-4 border-b border-slate-100 -mx-4 px-4 md:mx-0 md:px-0 md:bg-transparent md:border-none md:backdrop-filter-none md:static">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                            <input
                                type="text"
                                aria-label="Search modules"
                                placeholder="Search modules via title, description..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 shadow-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none bg-white font-medium"
                            />
                            {/* Loading Indicator inside Search (Optional, if immediate feedback needed) */}
                        </div>

                        {/* Sort */}
                        <div className="relative min-w-[220px] group">
                            <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                            <select
                                aria-label="Sort modules"
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                                className="w-full pl-12 pr-10 py-3 rounded-xl border border-slate-200 shadow-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none bg-white font-bold appearance-none cursor-pointer text-slate-700"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="difficulty_asc">Difficulty (Easy-Hard)</option>
                                <option value="difficulty_desc">Difficulty (Hard-Easy)</option>
                                <option value="progress_desc">Highest Progress</option>
                                <option value="progress_asc">Lowest Progress</option>
                                <option value="total_lessons_desc">Most Lessons</option>
                                <option value="total_lessons_asc">Least Lessons</option>
                                <option value="az">Alphabetical (A-Z)</option>
                                <option value="za">Alphabetical (Z-A)</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l border-slate-200 pl-2">
                                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-slate-400"></div>
                            </div>
                        </div>
                    </div>

                    {/* Active Filter Chips */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Filters:</span>

                            {debouncedSearch && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-lg flex items-center gap-1.5 hover:bg-primary/20 transition-colors"
                                >
                                    "{debouncedSearch}"
                                    <X size={14} />
                                </button>
                            )}

                            {sort !== 'newest' && (
                                <button
                                    onClick={() => setSort('newest')}
                                    className="px-3 py-1 bg-slate-100 text-slate-600 text-sm font-bold rounded-lg flex items-center gap-1.5 hover:bg-slate-200 transition-colors"
                                >
                                    Sort: {sort.replace(/_/g, ' ')}
                                    <X size={14} />
                                </button>
                            )}

                            <button
                                onClick={clearFilters}
                                className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors ml-auto"
                            >
                                Clear All
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modules Grid */}
            {modulesError ? (
                <QueryErrorState
                    message="Failed to load modules. Please check your connection."
                    onRetry={() => refetchModules()}
                />
            ) : (loading) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <ModuleSkeleton key={i} />
                    ))}
                </div>
            ) : modules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module: any, i: number) => (
                        <div key={module.id} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 50}ms` }}>
                            <ModuleCard module={module} highlight={debouncedSearch} priority={i < 3} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                        <Search size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">No modules found</h3>
                    <p className="text-slate-500 mb-6">We couldn't find any modules matching your criteria.</p>
                    <button
                        onClick={clearFilters}
                        className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            )}

            {/* Recent Activity */}
            <div className="pt-4">
                <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">Recent Activity</h2>
                <LearningActivityTable activity={activity} loading={activityLoading} />
            </div>
        </div>
    );
}
