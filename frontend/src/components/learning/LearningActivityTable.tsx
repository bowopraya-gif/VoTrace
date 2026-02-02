'use client';

import { LearningActivityItem } from '@/types/learning';
import { format } from 'date-fns';
import { History, Clock, BookOpen, CheckCircle2, PlayCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface LearningActivityTableProps {
    activity: LearningActivityItem[];
    loading?: boolean;
}

export default function LearningActivityTable({ activity, loading }: LearningActivityTableProps) {
    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <div className="h-6 w-40 bg-slate-200 rounded animate-pulse" />
                </div>
                <div className="divide-y divide-slate-100">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="p-5 flex items-center gap-4 animate-pulse">
                            <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                            <div className="flex-1 space-y-2">
                                <div className="h-5 w-1/3 bg-slate-200 rounded" />
                                <div className="h-4 w-1/4 bg-slate-100 rounded" />
                            </div>
                            <div className="h-6 w-20 bg-slate-200 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (activity.length === 0) {
        return (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center">
                <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-400">
                    <History size={24} />
                </div>
                <h3 className="text-lg font-medium text-slate-800">No learning activity yet</h3>
                <p className="text-slate-500 mt-1">Start a lesson to see your progress here!</p>
            </div>
        );
    }

    const getStatusBadge = (status: string, progress: number) => {
        if (status === 'completed') {
            return (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Completed
                </span>
            );
        }
        return (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex items-center gap-1">
                <PlayCircle size={12} />
                {progress}%
            </span>
        );
    };

    const formatDuration = (seconds: number) => {
        if (!seconds || seconds < 60) return `${seconds || 0}s`;
        const mins = Math.floor(seconds / 60);
        return `${mins}m`;
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <History size={20} className="text-slate-400" />
                    Recent Activity
                </h3>
            </div>

            <div className="divide-y divide-slate-100">
                {activity.map((item) => {
                    const progress = item.lesson.total_blocks > 0
                        ? Math.round((item.completed_blocks / item.lesson.total_blocks) * 100)
                        : 0;

                    return (
                        <Link
                            key={item.id}
                            href={`/learning/lessons/${item.lesson.slug}`}
                            className="p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors group"
                        >
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : 'bg-blue-100 text-blue-600'
                                }`}>
                                <BookOpen size={20} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 truncate group-hover:text-primary transition-colors">
                                    {item.lesson.title}
                                </p>
                                <p className="text-sm text-slate-500 truncate">
                                    {item.lesson.module?.title}
                                </p>
                            </div>

                            {/* Time Spent */}
                            <div className="hidden md:flex items-center gap-1 text-sm text-slate-500">
                                <Clock size={14} />
                                {formatDuration(item.time_spent)}
                            </div>

                            {/* Status */}
                            {getStatusBadge(item.status, progress)}

                            {/* Date */}
                            <span className="text-xs text-slate-400 whitespace-nowrap hidden lg:block">
                                {format(new Date(item.updated_at), 'MMM d, h:mm a')}
                            </span>

                            {/* Arrow */}
                            <ArrowRight size={16} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
