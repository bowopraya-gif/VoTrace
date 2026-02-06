'use client';

import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Module, Lesson } from '@/types/learning';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, BookOpen, Clock, PlayCircle, CheckCircle, Lock, Trophy, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import QueryErrorState from '@/components/ui/QueryErrorState';

export default function ModuleDetailPage() {
    const params = useParams();
    const slug = params.slug as string;

    const {
        data: module,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['learning', 'module', slug],
        queryFn: () => api.get(`/learning/modules/${slug}`).then(res => res.data),
        enabled: !!slug,
        staleTime: 5 * 60 * 1000,
    });

    const lessons: Lesson[] = module?.lessons || [];

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-8 animate-pulse p-4">
                <div className="h-64 bg-slate-100 rounded-3xl" />
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto py-20 px-4">
                <Link
                    href="/learning"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors py-2 mb-8"
                >
                    <ArrowLeft size={20} />
                    Back to Modules
                </Link>
                <QueryErrorState
                    message="Failed to load module details. Please check your connection."
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    if (!module) return <div>Module not found</div>;

    return (
        <div className="max-w-4xl mx-auto pb-20 px-4 sm:px-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Back Button */}
            <Link
                href="/learning"
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors py-2"
            >
                <ArrowLeft size={20} />
                Back to Modules
            </Link>

            {/* Module Hero */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xl h-[320px] md:h-[450px]">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    {module.thumbnail_url ? (
                        <Image
                            src={module.thumbnail_url}
                            alt={module.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                            className="object-cover opacity-80 mix-blend-overlay"
                            priority
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                    )}
                    {/* Dark gradient for text readability (changed from primary/blue) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                </div>

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row gap-8 items-end h-full">
                    <div className="flex-1 w-full flex flex-col h-full justify-between md:justify-end space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white border border-white/20 text-xs font-bold rounded-lg uppercase tracking-wider">
                                {module.category}
                            </span>
                            <span className="px-3 py-1 bg-emerald-500/20 backdrop-blur-md text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-lg uppercase tracking-wider">
                                {module.difficulty}
                            </span>
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
                                {module.title}
                            </h1>
                            <p className="text-slate-100 text-lg max-w-2xl leading-relaxed drop-shadow-md font-medium">
                                {module.description}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lessons List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">Curriculum</h2>
                    <span className="text-slate-500 font-medium text-sm">{lessons.length} Lessons</span>
                </div>

                <div className="space-y-4">
                    {lessons.map((lesson, idx) => {
                        const progress = lesson.user_progress || (lesson.progress as any);
                        const isCompleted = progress?.status === 'completed';
                        const isInProgress = progress?.status === 'in_progress';
                        const interactive = true;

                        return (
                            <Link
                                key={lesson.id}
                                href={interactive ? `/learning/lessons/${lesson.slug}` : '#'}
                                className={cn(
                                    "group flex items-center gap-6 p-6 rounded-2xl border transition-all duration-300",
                                    isCompleted
                                        ? "bg-emerald-50/50 border-emerald-100/50 hover:bg-emerald-50 hover:border-emerald-200"
                                        : "bg-white border-slate-100 hover:border-primary/30 hover:shadow-lg",
                                    !interactive && "opacity-50 cursor-not-allowed grayscale"
                                )}
                            >
                                {/* Index Number or Status Icon */}
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-110 shadow-sm shrink-0",
                                    isCompleted ? "bg-emerald-500 text-white shadow-emerald-200" :
                                        isInProgress ? "bg-amber-500 text-white shadow-amber-200" :
                                            "bg-slate-100 text-slate-400 group-hover:bg-primary group-hover:text-white"
                                )}>
                                    {isCompleted ? <CheckCircle size={24} /> :
                                        isInProgress ? <PlayCircle size={24} fill="currentColor" className="text-white" /> :
                                            (idx + 1)
                                    }
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className={cn(
                                        "text-lg font-bold mb-1 transition-colors truncate pr-4",
                                        isCompleted ? "text-slate-700 group-hover:text-emerald-600" : "text-slate-800 group-hover:text-primary"
                                    )}>
                                        {lesson.title}
                                    </h3>
                                    <p className="text-slate-500 text-sm line-clamp-1 mb-3">
                                        {lesson.description}
                                    </p>

                                    {/* Stats Row */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        {/* Status Badge */}
                                        <span className={cn(
                                            "flex items-center gap-1.5",
                                            isCompleted ? "text-emerald-600" : isInProgress ? "text-amber-600" : "text-slate-400"
                                        )}>
                                            {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Not Started"}
                                        </span>

                                        <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block" />

                                        {/* Time Stats Container */}
                                        <div className="flex items-center gap-4">
                                            {/* Estimated Time */}
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <Clock size={14} />
                                                Est. {lesson.estimated_mins}m
                                            </div>

                                            {/* Time Spent (if any) */}
                                            {progress?.time_spent ? (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300 sm:hidden" />
                                                    <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block" />
                                                    <div className="flex items-center gap-1.5 text-slate-500">
                                                        <BookOpen size={14} />
                                                        {Math.floor(progress.time_spent / 60)}m {progress.time_spent % 60}s
                                                    </div>
                                                </>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                <ArrowRight size={20} className={cn(
                                    "hidden md:block group-hover:translate-x-1 transition-transform text-slate-300 shrink-0",
                                    isCompleted ? "group-hover:text-emerald-600" : "group-hover:text-primary"
                                )} />
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
