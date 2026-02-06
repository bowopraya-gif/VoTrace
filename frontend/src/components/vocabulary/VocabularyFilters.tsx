'use client';

import React, { useEffect, useState } from 'react';
import { Search, Filter, X, ArrowUpDown } from 'lucide-react';
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
        <div className="sticky top-0 z-30 px-3 pt-0 pb-2 bg-slate-50/95 backdrop-blur-sm md:static md:bg-white/70 md:p-5 md:rounded-2xl md:border md:border-white/60 md:shadow-lg md:shadow-slate-200/50 mb-0 md:mb-8 md:ring-1 md:ring-black/5 transition-all">
            <div className="bg-white rounded-[24px] p-2 shadow-sm border border-slate-100 flex items-center gap-2 md:grid md:grid-cols-12 md:gap-6 md:items-end md:bg-transparent md:p-0 md:shadow-none md:border-none md:rounded-none">
                {/* Search */}
                <div className="flex-1 md:col-span-5 relative">
                    <div className="hidden md:block absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Search size={16} />
                    </div>
                    <Input
                        label={<span className="hidden md:inline">Search Vocabulary</span>}
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-4 md:pl-4 bg-slate-50 md:bg-white border-transparent md:border-slate-200 focus:bg-white focus:border-slate-200 transition-all shadow-none md:shadow-sm rounded-full md:rounded-xl h-10 md:h-11 text-sm md:text-sm placeholder:text-slate-400 font-medium"
                    />
                </div>

                {/* POS Filter */}
                <div className="md:col-span-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 hidden md:block mb-1.5">Type</label>
                    <div className="relative group">
                        {/* Mobile Icon Button */}
                        <div className="md:hidden w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 active:scale-95 transition-all">
                            <Filter size={18} />
                            {filters.pos && <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-500 rounded-full border border-white" />}
                        </div>

                        <select
                            aria-label="Filter by Type"
                            className="absolute inset-0 opacity-0 md:static md:opacity-100 w-full rounded-xl border border-slate-200 px-2 md:px-4 py-2.5 h-10 md:h-11 text-xs md:text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none appearance-none bg-white transition-all shadow-sm group-hover:bg-white cursor-pointer font-medium text-slate-700 capitalize"
                            value={filters.pos}
                            onChange={handlePosChange}
                        >
                            <option value="">All Types</option>
                            {posOptions.map(pos => (
                                <option key={pos} value={pos} className="capitalize">{pos}</option>
                            ))}
                        </select>
                        <Filter size={14} className="hidden md:block absolute right-3.5 top-3.5 text-slate-400 pointer-events-none group-hover:text-primary transition-colors" />
                    </div>
                </div>

                {/* Advanced Sort Dropdown */}
                <div className="md:col-span-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 hidden md:block mb-1.5">Smart Sort</label>
                    <div className="relative group">
                        {/* Mobile Icon Button */}
                        <div className="md:hidden w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 active:scale-95 transition-all">
                            <ArrowUpDown size={18} />
                        </div>

                        <select
                            aria-label="Sort vocabulary"
                            className="absolute inset-0 opacity-0 md:static md:opacity-100 w-full rounded-xl border border-slate-200 px-2 md:px-4 py-2.5 h-10 md:h-11 text-xs md:text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none appearance-none bg-white transition-all shadow-sm group-hover:bg-white cursor-pointer font-medium text-slate-700"
                            value={`${sortColumn}-${sortOrder}`}
                            onChange={(e) => {
                                const [col, ord] = e.target.value.split('-');
                                handleSortChange(col, ord as 'asc' | 'desc');
                            }}
                        >
                            <option value="created_at-desc">Default</option>
                            <option value="mastery_score-desc">Highest Mastery</option>
                            <option value="mastery_score-asc">Lowest Mastery</option>
                            <option value="srs_level-desc">Highest SRS</option>
                            <option value="srs_level-asc">Lowest SRS</option>
                            <option value="next_review_at-asc">Due Soon</option>
                            <option value="last_practiced_at-desc">Recently Practiced</option>
                            <option value="times_practiced-desc">Most Practiced</option>
                        </select>
                        <Filter size={14} className="hidden md:block absolute right-3.5 top-3.5 text-slate-400 pointer-events-none group-hover:text-primary transition-colors" />
                    </div>
                </div>
            </div>

            {/* Active Filters / Clear */}
            {hasActiveFilters && (
                <div className="mt-4 md:mt-5 flex items-center justify-between pt-4 border-t border-slate-200/60">
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
