'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, BookOpen, CheckCircle, Clock } from 'lucide-react';
import { useVocabularyStore } from '@/stores/vocabularyStore';
import { Button } from '@/components/ui/Button';
import { HighlightText } from '@/components/ui/HighlightText';

import { Vocabulary } from '@/types/vocabulary';
import { Sort } from '@/stores/vocabularyStore'; // Keeping Sort type for now

interface VocabularyTableProps {
    vocabularies: Vocabulary[];
    pagination: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
    sort: Sort;
    filters: { search: string }; // Minimal filter needed for highlight
    isLoading: boolean;
    onSort: (column: string) => void;
    onPageChange: (page: number) => void;
}

export const VocabularyTable = ({
    vocabularies,
    pagination,
    sort,
    filters,
    isLoading,
    onSort,
    onPageChange
}: VocabularyTableProps) => {
    const router = useRouter();
    // Removed store hook for data


    const handleSort = (column: string) => {
        onSort(column);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.last_page) {
            onPageChange(newPage);
        }
    };

    const getSortIcon = (column: string) => {
        if (sort.column !== column) return <ArrowUpDown size={14} className="text-neutral-400 opacity-0 group-hover:opacity-50 transition-opacity" />;
        return sort.order === 'asc'
            ? <ArrowUp size={14} className="text-primary" />
            : <ArrowDown size={14} className="text-primary" />;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'mastered':
                return 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/20 font-bold';
            case 'review':
                return 'bg-amber-100 text-amber-800 ring-1 ring-amber-600/20 font-bold';
            default:
                return 'bg-blue-100 text-blue-800 ring-1 ring-blue-600/20 font-bold';
        }
    };

    if (!isLoading && vocabularies.length === 0) {
        return (
            <div className="backdrop-blur-xl bg-white/60 rounded-2xl border border-white/50 p-16 text-center shadow-lg ring-1 ring-black/5">
                <div className="w-16 h-16 bg-blue-50/50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100">
                    <BookOpen className="text-primary" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">No vocabulary found</h3>
                <p className="text-slate-500 mt-2 mb-8 max-w-sm mx-auto">Your collection is empty. Start adding words to build your personal dictionary.</p>
                <Button variant="primary" onClick={() => router.push('/vocabulary/add')} className="shadow-lg shadow-primary/20">
                    Add My First Word
                </Button>
            </div>
        );
    }

    return (
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl border border-white/60 shadow-xl ring-1 ring-black/5 flex flex-col overflow-hidden transition-all duration-300">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200/60 bg-slate-50/50">
                            {[
                                { key: 'english_word', label: 'Word' },
                                { key: 'translation', label: 'Translation' },
                                { key: 'part_of_speech', label: 'Type' },
                                { key: 'learning_status', label: 'Status' },
                                { key: 'created_at', label: 'Date Added' },
                            ].map((col) => (
                                <th
                                    key={col.key}
                                    onClick={() => handleSort(col.key)}
                                    className="px-6 py-5 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer group hover:bg-slate-100/50 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-2">
                                        {col.label}
                                        {getSortIcon(col.key)}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            // Skeleton Loading Rows
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-5"><div className="h-5 bg-slate-200 rounded w-28"></div></td>
                                    <td className="px-6 py-5"><div className="h-5 bg-slate-200 rounded w-36"></div></td>
                                    <td className="px-6 py-5"><div className="h-5 bg-slate-200 rounded w-16"></div></td>
                                    <td className="px-6 py-5"><div className="h-7 bg-slate-200 rounded-full w-24"></div></td>
                                    <td className="px-6 py-5"><div className="h-5 bg-slate-200 rounded w-24"></div></td>
                                </tr>
                            ))
                        ) : (
                            vocabularies.map((vocab) => (
                                <tr
                                    key={vocab.id}
                                    onClick={() => router.push(`/vocabulary/${vocab.uuid}`)}
                                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] relative z-0 hover:z-10"
                                >
                                    <td className="px-6 py-5">
                                        <div className="font-extrabold text-slate-900 text-[15px] group-hover:text-primary transition-colors">
                                            <HighlightText text={vocab.english_word} highlight={filters.search} />
                                        </div>
                                        {vocab.pronunciation && (
                                            <div className="text-xs text-slate-500 font-mono mt-1 font-medium">{vocab.pronunciation}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-slate-700 font-semibold">
                                        <HighlightText text={vocab.translation} highlight={filters.search} />
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700 capitalize border border-slate-300 shadow-sm">
                                            {vocab.part_of_speech}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize shadow-sm ${getStatusColor(vocab.learning_status)}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${vocab.learning_status === 'mastered' ? 'bg-emerald-500' :
                                                vocab.learning_status === 'review' ? 'bg-amber-500' : 'bg-blue-500'
                                                }`}></span>
                                            {vocab.learning_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-sm text-slate-500 whitespace-nowrap font-medium">
                                        {new Date(vocab.created_at!).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric', year: 'numeric'
                                        })}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile List View (Cards) - Restored Top Rounding */}
            <div className="md:hidden px-0 space-y-0 bg-white rounded-t-3xl border-t border-slate-100">
                {isLoading ? (
                    // Skeleton Cards
                    [...Array(5)].map((_, i) => (
                        <div key={i} className="p-6 border-b border-slate-100 animate-pulse">
                            <div className="flex justify-between mb-6">
                                <div className="h-6 bg-slate-200 rounded-lg w-16"></div>
                                <div className="h-4 bg-slate-200 rounded w-20"></div>
                            </div>
                            <div className="space-y-3 mb-8">
                                <div className="h-10 bg-slate-200 rounded-xl w-3/4"></div>
                                <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="h-2 bg-slate-200 rounded-full w-24"></div>
                                <div className="h-10 bg-slate-200 rounded-xl w-24"></div>
                            </div>
                        </div>
                    ))
                ) : (
                    vocabularies.map((vocab) => {
                        // Calculate progress based on mastery_score or status fallback
                        const progress = vocab.mastery_score !== undefined
                            ? vocab.mastery_score
                            : (vocab.learning_status === 'mastered' ? 100 : vocab.learning_status === 'review' ? 60 : 25);

                        return (
                            <div
                                key={vocab.id}
                                onClick={() => router.push(`/vocabulary/${vocab.uuid}`)}
                                className="p-6 border-b border-slate-100 active:bg-slate-50 transition-colors cursor-pointer relative overflow-hidden group"
                            >
                                {/* Card Header: Type & Date */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black bg-purple-100 text-purple-700 uppercase tracking-widest">
                                        {vocab.part_of_speech}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {new Date(vocab.created_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>

                                {/* Card Body: Word & Translation */}
                                <div className="flex flex-col gap-0 mb-5 relative z-10">
                                    <div className="font-black text-slate-900 text-3xl tracking-tight leading-none break-words pb-1">
                                        <HighlightText text={vocab.english_word} highlight={filters.search} />
                                    </div>
                                    <div className="text-lg text-slate-500 font-medium break-words leading-tight">
                                        <HighlightText text={vocab.translation} highlight={filters.search} />
                                    </div>
                                    {/* Usage Note (Optional) */}
                                    {vocab.usage_note && (
                                        <div className="mt-3 text-slate-400 italic font-light text-sm leading-relaxed line-clamp-2">
                                            "{vocab.usage_note}"
                                        </div>
                                    )}
                                </div>

                                {/* Card Footer: Progress & Action */}
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    {/* Progress Bar */}
                                    <div className="flex items-center gap-3 flex-1 mr-4">
                                        <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400">{progress}%</span>
                                    </div>

                                    {/* Status Badge (Replaces Review Button) */}
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold capitalize shadow-sm border ${vocab.learning_status === 'mastered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                        vocab.learning_status === 'review' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                            'bg-blue-50 text-blue-700 border-blue-100'
                                        }`}>
                                        {vocab.learning_status === 'mastered' && <CheckCircle size={14} className="mr-1.5" />}
                                        {vocab.learning_status === 'review' && <Clock size={14} className="mr-1.5" />}
                                        {vocab.learning_status === 'learning' && <BookOpen size={14} className="mr-1.5" />}
                                        {vocab.learning_status}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {!isLoading && pagination.total > 0 && (
                <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between rounded-b-3xl">
                    <p className="text-sm text-slate-500 font-medium">
                        Showing <span className="text-slate-900 font-bold">{(pagination.current_page - 1) * pagination.per_page + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> of <span className="text-slate-900 font-bold">{pagination.total}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(pagination.current_page - 1)}
                            disabled={pagination.current_page === 1}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:text-primary hover:border-primary/50 hover:shadow-md transition-all shadow-sm"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-bold text-slate-700 min-w-[32px] text-center bg-white border border-slate-200 rounded-lg py-1.5 shadow-sm">
                            {pagination.current_page}
                        </span>
                        <button
                            onClick={() => handlePageChange(pagination.current_page + 1)}
                            disabled={pagination.current_page === pagination.last_page}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:text-primary hover:border-primary/50 hover:shadow-md transition-all shadow-sm"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
