"use client";

import { PracticeHistoryItem } from '@/types/practice';
import { format } from 'date-fns';
import { History, Clock, Target, CheckCircle } from 'lucide-react';

interface PracticeHistoryTableProps {
    history: PracticeHistoryItem[];
}

export default function PracticeHistoryTable({ history }: PracticeHistoryTableProps) {
    if (history.length === 0) {
        return (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center">
                <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-400">
                    <History size={24} />
                </div>
                <h3 className="text-lg font-medium text-slate-800">No practice history</h3>
                <p className="text-slate-500 mt-1">Complete your first session to see it here!</p>
            </div>
        );
    }

    // Identify mode formatter style
    const getModeBadge = (mode: string) => {
        const styles: Record<string, string> = {
            'multiple_choice': 'bg-blue-100 text-blue-700',
            'typing': 'bg-purple-100 text-purple-700',
            'listening': 'bg-emerald-100 text-emerald-700',
            'mixed': 'bg-orange-100 text-orange-700',
        };
        const labels: Record<string, string> = {
            'multiple_choice': 'Multiple Choice',
            'typing': 'Typing',
            'listening': 'Listening',
            'mixed': 'Mixed',
        };

        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[mode] || 'bg-slate-100 text-slate-700'}`}>
                {labels[mode] || mode}
            </span>
        );
    };

    // Format duration
    const formatDuration = (seconds: number | null) => {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <History size={20} className="text-slate-400" />
                    Recent Sessions
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-xs">
                            <th className="px-6 py-4 font-semibold">Mode</th>
                            <th className="px-6 py-4 font-semibold">Score</th>
                            <th className="px-6 py-4 font-semibold">Accuracy</th>
                            <th className="px-6 py-4 font-semibold">Duration</th>
                            <th className="px-6 py-4 font-semibold">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {history.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    {getModeBadge(item.mode)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                        <CheckCircle size={14} className="text-emerald-500" />
                                        {item.correct_answers} <span className="text-slate-400">/ {item.total_questions}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 font-bold">
                                        <Target size={14} className={
                                            item.accuracy >= 80 ? 'text-emerald-500' :
                                                item.accuracy >= 60 ? 'text-amber-500' : 'text-red-500'
                                        } />
                                        <span className={
                                            item.accuracy >= 80 ? 'text-emerald-600' :
                                                item.accuracy >= 60 ? 'text-amber-600' : 'text-red-600'
                                        }>
                                            {item.accuracy}%
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={14} />
                                        {formatDuration(item.duration_seconds)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                    {format(new Date(item.created_at), 'MMM d, h:mm a')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
