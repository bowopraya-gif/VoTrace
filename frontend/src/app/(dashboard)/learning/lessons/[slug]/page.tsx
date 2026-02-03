'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Lesson } from '@/types/learning';
import BlockRenderer from '@/components/learning/BlockRenderer';
import { X, Info, ListChecks, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import QueryErrorState from '@/components/ui/QueryErrorState';

export default function LessonViewerPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const slug = params.slug as string;

    // UI State
    const [showRequirements, setShowRequirements] = useState(false);
    // Optimistic / Local progress state
    const [completedBlockIds, setCompletedBlockIds] = useState<Set<number>>(new Set());

    // Time Tracking Refs
    const timeSpentRef = useRef(0);

    // 1. Fetch Lesson Data
    const {
        data: lesson,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['learning', 'lesson', slug],
        queryFn: async () => {
            const res = await api.get(`/learning/lessons/${slug}`);
            return res.data;
        },
        enabled: !!slug,
        staleTime: 5 * 60 * 1000,
    });

    // 2. Start Lesson Mutation
    const startLessonMutation = useMutation({
        mutationFn: (id: number) => api.post(`/learning/lessons/${id}/start`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['learning', 'history'] });
        }
    });

    // 3. Progress Mutation
    const progressMutation = useMutation({
        mutationFn: (data: any) => api.post(`/learning/lessons/${lesson?.id}/progress`, data),
    });

    // 4. Complete Mutation
    const completeMutation = useMutation({
        mutationFn: () => api.post(`/learning/lessons/${lesson?.id}/complete`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['learning', 'module', lesson?.module?.slug] });
            queryClient.invalidateQueries({ queryKey: ['learning', 'stats'] });
        }
    });

    // Initialize Local State & Start Lesson
    useEffect(() => {
        if (lesson) {
            // Set completed blocks from DB
            const progress = lesson.user_progress || lesson.progress;
            if (progress) {
                if (progress.completed_block_ids && Array.isArray(progress.completed_block_ids)) {
                    setCompletedBlockIds(new Set(progress.completed_block_ids));
                }
            }

            // Start Lesson Tracking
            if (lesson.id) {
                startLessonMutation.mutate(lesson.id);
            }
        }
    }, [lesson?.id]);

    // Time Tracking Logic
    useEffect(() => {
        if (!lesson || isLoading) return;

        const timer = setInterval(() => {
            if (document.visibilityState === 'visible') {
                timeSpentRef.current += 1;
            }
        }, 1000);

        const syncer = setInterval(() => {
            syncTime();
        }, 10000);

        return () => {
            clearInterval(timer);
            clearInterval(syncer);
            syncTime();
        };
    }, [lesson, isLoading]);

    const syncTime = () => {
        if (!lesson || timeSpentRef.current === 0) return;
        const timeToAdd = timeSpentRef.current;
        timeSpentRef.current = 0;
        progressMutation.mutate({ add_time: timeToAdd });
    };

    const handleBlockComplete = (blockId: number, isCorrect: boolean) => {
        if (!lesson) return;

        // Optimistic UI update
        setCompletedBlockIds(prev => {
            const next = new Set(prev);
            next.add(blockId);
            return next;
        });

        // Server update
        progressMutation.mutate({
            block_id: blockId,
            increment_completed: true,
            increment_correct: isCorrect
        });
    };

    const handleFinish = () => {
        if (!lesson) return;
        syncTime();

        completeMutation.mutate(undefined, {
            onSuccess: () => {
                confetti({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.6 },
                    colors: ['#10b981', '#3b82f6', '#f59e0b']
                });
                setTimeout(() => {
                    router.push(`/learning/modules/${lesson.module?.slug}`);
                }, 1500);
            },
            onError: (err) => {
                console.error("Failed to complete lesson", err);
                alert("Failed to save completion. Please try again.");
            }
        });
    };

    // --- Requirements Logic (Memoized) ---
    const progressStatus = useMemo(() => {
        if (!lesson || !lesson.content_blocks) return { percent: 0, canFinish: false, requirements: [] };

        const blocks = lesson.content_blocks;
        const totalBlocks = blocks.length;
        const criteria = lesson.completion_criteria;

        let metCount = 0;
        let totalCount = 0;
        let canFinish = false;
        let requirementsList: { label: string; met: boolean }[] = [];

        // 1. Interactive Blocks Handling (Quizzes, Vocab)
        const interactiveTypes = ['quiz_mc', 'quiz_typing', 'quiz_fill', 'vocabulary'];
        const interactiveBlocks = blocks.filter((b: any) => interactiveTypes.includes(b.type));
        const completedInteractive = interactiveBlocks.filter((b: any) => completedBlockIds.has(b.id)).length;

        if (criteria?.min_interactive) {
            totalCount = criteria.min_interactive;
            metCount = Math.min(completedInteractive, totalCount);
            canFinish = completedInteractive >= totalCount;

            requirementsList.push({
                label: `Complete ${criteria.min_interactive} interactive activities (${completedInteractive}/${criteria.min_interactive})`,
                met: canFinish
            });
        }
        else {
            // Default Rule: All "Required" blocks
            const requiredBlocks = blocks.filter((b: any) => b.is_required);

            if (requiredBlocks.length === 0) {
                // Fallback: All interactive blocks
                totalCount = interactiveBlocks.length;
                metCount = completedInteractive;
                canFinish = metCount >= totalCount;
                requirementsList.push({
                    label: `Complete all activities (${metCount}/${totalCount})`,
                    met: canFinish
                });
            } else {
                const completedRequired = requiredBlocks.filter((b: any) => completedBlockIds.has(b.id)).length;
                totalCount = requiredBlocks.length;
                metCount = completedRequired;
                canFinish = metCount >= totalCount;

                requirementsList.push({
                    label: `Complete required items (${metCount}/${totalCount})`,
                    met: canFinish
                });
            }
        }

        const percent = totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 100;

        return { percent, canFinish, requirements: requirementsList };
    }, [lesson, completedBlockIds]);

    // Loading State
    if (isLoading) return (
        <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 font-bold animate-pulse">Loading Lesson...</p>
        </div>
    );

    // Error State
    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full">
                <QueryErrorState
                    message="Failed to load lesson content."
                    onRetry={() => refetch()}
                />
                <button
                    onClick={() => router.back()}
                    className="mt-6 w-full py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                >
                    Go Back
                </button>
            </div>
        </div>
    );

    if (!lesson) return <div>Lesson not found</div>;

    const blocks = lesson.content_blocks || [];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200 z-50 flex items-center px-4 lg:px-8 justify-between shadow-sm">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-800"
                >
                    <X size={24} />
                </button>

                {/* Progress Bar & Dropdown Trigger */}
                <div className="flex-1 max-w-sm mx-4 relative">
                    <div className="flex items-center justify-between mb-1.5 cursor-pointer" onClick={() => setShowRequirements(!showRequirements)}>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            Progress
                            <Info size={14} className="text-slate-400 hover:text-emerald-500 transition-colors" />
                        </span>
                        <span className="text-xs font-bold text-emerald-600">{progressStatus.percent}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressStatus.percent}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="h-full bg-emerald-500 rounded-full"
                        />
                    </div>

                    {/* Requirements Dropdown */}
                    <AnimatePresence>
                        {showRequirements && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full left-0 right-0 mt-4 p-4 bg-white rounded-xl shadow-xl border border-slate-100 z-50 origin-top"
                            >
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                    <ListChecks size={14} />
                                    Requirements
                                </h4>
                                <ul className="space-y-2">
                                    {progressStatus.requirements.map((req, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm font-medium">
                                            {req.met ? (
                                                <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                                            ) : (
                                                <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-200 shrink-0" />
                                            )}
                                            <span className={req.met ? "text-slate-700 decoration-slate-300" : "text-slate-500"}>
                                                {req.label}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="w-10 flex justify-end"></div>
            </div>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto pt-28 px-4 sm:px-6 pb-40 space-y-12">
                <div className="text-center mb-12">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-3">{lesson.title}</h1>
                    <p className="text-slate-500 font-medium">{lesson.description}</p>
                </div>

                {/* Content Blocks */}
                <div className="space-y-8">
                    {blocks.map((block, index) => {
                        const isCritical = index < 2;
                        return (
                            <div
                                key={block.id}
                                className={`
                                    w-full
                                    ${isCritical
                                        ? ''
                                        : 'animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both'
                                    }
                                `}
                                style={{ animationDelay: isCritical ? '0ms' : `${Math.min(index * 50, 300)}ms` }}
                            >
                                <BlockRenderer
                                    block={block}
                                    isCompleted={completedBlockIds.has(block.id)}
                                    onBlockComplete={handleBlockComplete}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Finish Section */}
                <motion.div
                    className="mt-16 pt-8 border-t border-slate-200 text-center"
                >
                    <button
                        onClick={handleFinish}
                        disabled={!progressStatus.canFinish || completeMutation.isPending}
                        className={`
                            px-12 py-4 rounded-2xl font-black text-lg flex items-center gap-3 mx-auto transition-all duration-300
                            ${progressStatus.canFinish && !completeMutation.isPending
                                ? "bg-emerald-600 text-white shadow-xl shadow-emerald-200 hover:scale-105 hover:bg-emerald-500 active:scale-95"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed grayscale"}
                        `}
                    >
                        {completeMutation.isPending ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <CheckCircle size={24} />
                        )}
                        {progressStatus.canFinish ? 'Complete Lesson' : 'Complete Requirements'}
                    </button>
                    {!progressStatus.canFinish && (
                        <div className="mt-4 text-sm text-slate-400 font-medium cursor-pointer hover:text-emerald-600 transition-colors" onClick={() => setShowRequirements(true)}>
                            Tap to see what's missing
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
