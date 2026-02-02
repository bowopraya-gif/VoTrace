'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useVocabularyStore } from '@/stores/vocabularyStore';
import { Button } from '@/components/ui/Button';
import { HighlightText } from '@/components/ui/HighlightText';

import { Vocabulary } from '@/types/vocabulary';
import { Pagination } from '@/types/pagination'; // Assuming this type exists or will define it
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
            <div className="overflow-x-auto">
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

            {/* Pagination */}
            {!isLoading && pagination.total > 0 && (
                <div className="px-6 py-4 border-t border-slate-200/60 bg-slate-50/30 flex items-center justify-between backdrop-blur-sm">
                    <p className="text-sm text-slate-500 font-medium">
                        Showing <span className="text-slate-800">{(pagination.current_page - 1) * pagination.per_page + 1}</span> to <span className="text-slate-800">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> of <span className="text-slate-800">{pagination.total}</span>
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
