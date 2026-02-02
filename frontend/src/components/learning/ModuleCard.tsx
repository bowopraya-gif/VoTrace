'use client';

import { Module } from '@/types/learning';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, BarChart, CheckCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

import { HighlightText } from '@/components/ui/HighlightText';

interface ModuleCardProps {
    module: Module;
    highlight?: string;
}

export default function ModuleCard({ module, highlight = '' }: ModuleCardProps) {
    const isCompleted = (module.completed_lessons_count || 0) === module.lessons_count;
    const isStarted = (module.completed_lessons_count || 0) > 0;
    const queryClient = useQueryClient();

    const handleMouseEnter = () => {
        // Prefetch module details on hover for instant load
        queryClient.prefetchQuery({
            queryKey: ['learning', 'module', module.slug],
            queryFn: () => api.get(`/learning/modules/${module.slug}`).then(r => r.data),
            staleTime: 5 * 60 * 1000, // 5 minutes
        });
    };

    return (
        <Link
            href={`/learning/modules/${module.slug}`}
            onMouseEnter={handleMouseEnter}
            className="group flex flex-col h-full bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
        >
            {/* Thumbnail */}
            <div className="relative h-48 bg-slate-900 overflow-hidden">
                {module.thumbnail_url ? (
                    <Image
                        src={module.thumbnail_url}
                        alt={module.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                        priority={false}
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />

                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-xs font-bold rounded-lg uppercase tracking-wider border border-white/20">
                        {module.difficulty}
                    </span>
                    {isCompleted && (
                        <span className="px-3 py-1 bg-emerald-500/90 text-white text-xs font-bold rounded-lg uppercase tracking-wider shadow-lg flex items-center gap-1">
                            <CheckCircle size={12} />
                            Completed
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col">
                <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-2">
                        <HighlightText text={module.title} highlight={highlight} />
                    </h3>
                    <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
                        <HighlightText text={module.description} highlight={highlight} />
                    </p>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mt-auto pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                        <BookOpen size={14} />
                        {module.completed_lessons_count !== undefined ? `${module.completed_lessons_count}/` : ''}{module.lessons_count} Lessons
                    </div>
                    {module.progress_percent !== undefined && module.progress_percent > 0 && (
                        <div className="flex items-center gap-1 text-primary">
                            <BarChart size={14} />
                            {module.progress_percent}%
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Bar (Bottom) */}
            {
                module.progress_percent !== undefined && (
                    <div className="h-1.5 bg-slate-100 w-full mt-auto">
                        <div
                            className="h-full bg-primary transition-all duration-1000 ease-out"
                            style={{ width: `${module.progress_percent}%` }}
                        />
                    </div>
                )
            }
        </Link >
    );
}
