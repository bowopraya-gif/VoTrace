"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { StreakHistoryItem } from '@/types/streak';
import { format } from 'date-fns';
import { Award, Calendar } from 'lucide-react';

export default function StreakHistory() {
    const [history, setHistory] = useState<StreakHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            const res = await api.get('/streak/history');
            setHistory(res.data);
            setLoading(false);
        };
        fetchHistory();
    }, []);

    if (loading) return <div className="h-40 animate-pulse bg-slate-100 rounded-2xl"></div>;

    if (history.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-300 text-center text-slate-500">
                No streak history found yet. Start learning!
            </div>
        );
    }

    return (
        <div className="bg-white p-6 md:p-8 rounded-[24px] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                    <Award size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Top Streak History</h3>
            </div>

            <div className="space-y-3">
                {history.map((streak, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:bg-slate-100"
                    >
                        <div className="flex items-center gap-4">
                            {/* Rank Badge */}
                            <div className={`
                                w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm
                                ${index === 0 ? 'bg-yellow-400 text-white shadow-yellow-200' :
                                    index === 1 ? 'bg-slate-300 text-white' :
                                        index === 2 ? 'bg-orange-300 text-white' : 'bg-slate-200 text-slate-500'}
                            `}>
                                #{index + 1}
                            </div>

                            <div>
                                <p className="font-bold text-slate-800 text-lg">
                                    {streak.length} <span className="text-sm font-normal text-slate-500">days</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Calendar size={14} />
                            <span>
                                {format(new Date(streak.start_date), 'MMM d, yyyy')} - {format(new Date(streak.end_date), 'MMM d, yyyy')}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
