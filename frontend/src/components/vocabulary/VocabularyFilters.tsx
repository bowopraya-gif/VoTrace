'use client';

import React, { useEffect, useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Sort } from '@/stores/vocabularyStore';
import { PartOfSpeech } from '@/types/vocabulary';

import { Input } from '@/components/ui/Input';

interface FiltersState {
    search: string;
    status: string;
    pos: string;
}

interface VocabularyFiltersProps {
    filters: FiltersState;
    sort: Sort;
    onFilterChange: (newFilters: Partial<FiltersState>) => void;
    onSortChange: (column: string, order: 'asc' | 'desc') => void;
    onClear: () => void;
}

export const VocabularyFilters = ({
    filters,
    sort,
    onFilterChange,
    onSortChange,
    onClear
}: VocabularyFiltersProps) => {
    // Local state for immediate input feedback (debounce)
    const [searchTerm, setSearchTerm] = useState(filters.search);
    const sortColumn = sort.column;
    const sortOrder = sort.order;

    // Debounce search
    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== filters.search) {
                onFilterChange({ search: searchTerm });
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, filters.search, onFilterChange]);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange({ status: e.target.value });
    };

    const handlePosChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange({ pos: e.target.value });
    };

    const handleSortChange = (column: string, order: 'asc' | 'desc') => {
        onSortChange(column, order);
    };

    const clearFilters = () => {
        setSearchTerm('');
        onClear();
    };

    const hasActiveFilters = searchTerm || filters.status || filters.pos;

    // TODO: Move PartOfSpeech options to a shared constant/utils
    const posOptions: PartOfSpeech[] = [
        'noun', 'verb', 'adjective', 'adverb', 'pronoun',
        'preposition', 'conjunction', 'interjection', 'phrase', 'idiom', 'other'
    ];

    return (
        <div className="backdrop-blur-xl bg-white/70 p-5 rounded-2xl border border-white/60 shadow-lg shadow-slate-200/50 mb-8 ring-1 ring-black/5 transition-all">
            <div className="grid grid-cols-12 gap-2 md:gap-6 items-end">
                {/* Search */}
                <div className="col-span-5 md:col-span-5">
                    <Input
                        label={<span className="hidden md:inline">Search Vocabulary</span>}
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white/50 border-slate-200 focus:bg-white transition-all shadow-sm"
                    />
                </div>

                {/* POS Filter */}
                <div className="col-span-4 md:col-span-3 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 hidden md:block">Type</label>
                    <div className="relative group">
                        <select
                            aria-label="Filter by Type"
                            className="w-full rounded-xl border border-slate-200 px-2 md:px-4 py-2.5 text-xs md:text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none appearance-none bg-white/50 transition-all shadow-sm group-hover:bg-white cursor-pointer font-medium text-slate-700 capitalize"
                            value={filters.pos}
                            onChange={handlePosChange}
                        >
                            <option value="">All Types</option>
                            {posOptions.map(pos => (
                                <option key={pos} value={pos} className="capitalize">{pos}</option>
                            ))}
                        </select>
                        <Filter size={14} className="hidden md:block absolute right-3.5 top-3 text-slate-400 pointer-events-none group-hover:text-primary transition-colors" />
                    </div>
                </div>

                {/* Advanced Sort Dropdown */}
                <div className="col-span-3 md:col-span-4 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 hidden md:block">Smart Sort</label>
                    <div className="relative group">
                        <select
                            aria-label="Sort vocabulary"
                            className="w-full rounded-xl border border-slate-200 px-2 md:px-4 py-2.5 text-xs md:text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none appearance-none bg-white/50 transition-all shadow-sm group-hover:bg-white cursor-pointer font-medium text-slate-700"
                            value={`${sortColumn}-${sortOrder}`}
                            onChange={(e) => {
                                const [col, ord] = e.target.value.split('-');
                                handleSortChange(col, ord as 'asc' | 'desc');
                            }}
                        >
                            <option value="created_at-desc">Default</option>
                            <option value="mastery_score-desc">📈 Highest Mastery</option>
                            <option value="mastery_score-asc">📉 Lowest Mastery</option>
                            <option value="srs_level-desc">🧠 Highest SRS</option>
                            <option value="srs_level-asc">🆕 Lowest SRS</option>
                            <option value="next_review_at-asc">⏰ Due Soon</option>
                            <option value="last_practiced_at-desc">🕐 Recently Practiced</option>
                            <option value="times_practiced-desc">🔥 Most Practiced</option>
                        </select>
                        <Filter size={14} className="hidden md:block absolute right-3.5 top-3 text-slate-400 pointer-events-none group-hover:text-primary transition-colors" />
                    </div>
                </div>
            </div>

            {/* Active Filters / Clear */}
            {hasActiveFilters && (
                <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-200/60">
                    <div className="text-sm text-slate-500 font-medium pl-1">
                        Filters active
                    </div>
                    <button
                        onClick={clearFilters}
                        className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all"
                    >
                        <X size={14} />
                        Clear All Filters
                    </button>
                </div>
            )}
        </div>
    );
};
