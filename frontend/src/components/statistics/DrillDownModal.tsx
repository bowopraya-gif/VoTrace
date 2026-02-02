'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { DrillDownVocabulary, DrillDownResponse } from '@/types/statistics';

interface DrillDownModalProps {
    type: string;
    value: string;
    label: string;
    timezone?: string;
    onClose: () => void;
}

export default function DrillDownModal({ type, value, label, timezone = 'UTC', onClose }: DrillDownModalProps) {
    const [data, setData] = useState<DrillDownVocabulary[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await api.get<DrillDownResponse>('/statistics/vocabulary/drill-down', {
                    params: { type, value, page, per_page: 15, tz: timezone }
                });
                setData(res.data.data);
                setTotalPages(res.data.last_page);
            } catch (error) {
                console.error('Failed to load drill-down data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [type, value, page]);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-100">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">{label}</h2>
                            <p className="text-sm text-slate-500 mt-1">
                                {type === 'pos' && 'Words with this part of speech'}
                                {type === 'status' && 'Words with this learning status'}
                                {type === 'srs_level' && 'Words at this SRS level'}
                                {type === 'difficulty' && 'Words in this difficulty range'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                                ))}
                            </div>
                        ) : data.length === 0 ? (
                            <p className="text-center text-slate-400 py-8">No words found</p>
                        ) : (
                            <div className="space-y-2">
                                {data.map((word) => (
                                    <a
                                        key={word.id}
                                        href={`/vocabulary/${word.id}`}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                                    >
                                        <div className="flex-1">
                                            <span className="font-medium text-slate-800 group-hover:text-blue-600">
                                                {word.english_word}
                                            </span>
                                            <span className="text-slate-400 mx-2">→</span>
                                            <span className="text-slate-600">{word.translation}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={word.learning_status} />
                                            {word.difficulty_score !== null && (
                                                <span className="text-xs text-slate-400">
                                                    {Math.round(word.difficulty_score)}% diff
                                                </span>
                                            )}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer with pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 p-4 border-t border-slate-100">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-slate-500">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors = {
        mastered: 'bg-green-100 text-green-700',
        learning: 'bg-yellow-100 text-yellow-700',
        review: 'bg-orange-100 text-orange-700',
    };

    return (
        <span className={`px-2 py-0.5 text-xs rounded-full ${colors[status as keyof typeof colors] || 'bg-slate-100 text-slate-600'}`}>
            {status}
        </span>
    );
}
