'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { VocabularyDetailCard } from '@/components/vocabulary/VocabularyDetailCard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Vocabulary } from '@/types/vocabulary';

export default function VocabularyDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { user, isLoading: authLoading } = useAuthStore();
    const queryClient = useQueryClient();

    // 1. Try to find vocab in existing list cache (INSTANT LOAD)
    const cachedVocab = queryClient.getQueriesData<any>({ queryKey: ['vocabularies'] })
        ?.flatMap(([_, data]) => data?.data || [])
        ?.find((v: Vocabulary) => v.uuid === id);

    // 2. Fetch full detail (Background update)
    // 2. Fetch full detail (Background update)
    const { data: vocabulary, isLoading, error, isFetching } = useQuery({
        queryKey: ['vocabulary', id],
        queryFn: async () => {
            const res = await api.get(`/vocabularies/${id}`);
            return res.data;
        },
        initialData: cachedVocab, // Show cached data immediately!
        enabled: !!id && !!user,
        staleTime: 0, // IMPORTANT: trigger fetch immediately to get full details (examples, notes)
    });

    if (authLoading) return <LoadingSpinner />;
    if (!user) {
        router.push('/login');
        return null;
    }

    if (error) {
        return <ErrorState error={error} onBack={() => router.push('/vocabulary')} />;
    }

    if (isLoading && !vocabulary) {
        return <LoadingSpinner />;
    }

    if (!vocabulary) return null;

    // Check if we are still fetching details (if we only have cached partial data)
    // Cached data usually lacks 'example_sentences' or 'usage_note' if they were stripped in list
    // We can assume if it came from cache, might be partial. 
    // But useQuery `isLoading` is true only if no data. `isFetching` is true if background fetch.
    // We can pass `isFetching` to show skeletons for missing parts.

    return (
        <VocabularyDetailCard
            vocabulary={vocabulary}
            isFetchingDetails={isFetching}
        />
    );
}

function LoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50/50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );
}

function ErrorState({ error, onBack }: { error: any, onBack: () => void }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50/50">
            <div className="text-center">
                <h2 className="text-xl font-bold text-neutral-900">Failed to load vocabulary</h2>
                <button onClick={onBack} className="text-primary hover:underline mt-2">
                    Return to List
                </button>
            </div>
        </div>
    );
}
