"use client";

import { useQuery } from '@tanstack/react-query';
import QueryErrorState from '@/components/ui/QueryErrorState';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import PracticeResult from '@/components/practice/PracticeResult';
import { Loader2 } from 'lucide-react';

export default function ResultPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get('id');

    const {
        data: sessionData,
        isLoading,
        error: queryError,
        refetch
    } = useQuery({
        queryKey: ['practice', 'session', sessionId],
        queryFn: () => api.get(`/practice/session/${sessionId}`).then(res => res.data),
        enabled: !!sessionId,
        staleTime: Infinity, // Session result doesn't change
    });

    const result = sessionData?.session;
    const wrongAnswers = sessionData?.wrong_answers || [];

    // Read skipped count from URL (passed from session page)
    const skippedCount = parseInt(searchParams.get('skipped') || '0', 10);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-slate-500 font-medium animate-pulse">Calculating scores...</p>
            </div>
        );
    }

    if (queryError || (!isLoading && !result && sessionId)) {
        return (
            <QueryErrorState
                message={queryError ? "Failed to load session results." : "Session not found."}
                onRetry={refetch}
            />
        );
    }

    if (!sessionId) {
        // Redirect if no ID
        if (typeof window !== 'undefined') router.push('/practice');
        return null;
    }

    if (!result) return null;

    return (
        <div className="py-12 px-4">
            <PracticeResult result={result} wrongAnswers={wrongAnswers} skippedCount={skippedCount} />
        </div>
    );
}
