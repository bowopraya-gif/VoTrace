import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import api from '@/lib/api';

/**
 * Hook to pre-fetch data for main navigation pages.
 * Used for "Instant Navigation" experience.
 */
export const useNavigationPrefetch = () => {
    const queryClient = useQueryClient();

    /**
     * Pre-fetch Vocabulary List
     * Matches default state in: src/app/(dashboard)/vocabulary/page.tsx
     */
    const prefetchVocabulary = useCallback(async () => {
        const defaultPage = 1;
        const defaultFilters = { search: '', status: '', pos: '' };
        const defaultSort = { column: 'created_at', order: 'desc' };

        await queryClient.prefetchQuery({
            queryKey: ['vocabularies', {
                page: defaultPage,
                ...defaultFilters,
                ...defaultSort
            }],
            queryFn: async () => {
                const params = {
                    page: defaultPage,
                    search: defaultFilters.search,
                    status: defaultFilters.status,
                    pos: defaultFilters.pos,
                    sort: defaultSort.column,
                    order: defaultSort.order,
                };
                const res = await api.get('/vocabularies', { params });
                return res.data;
            },
            staleTime: 2 * 60 * 1000, // 2 minutes (Matches Page)
        });
    }, [queryClient]);

    /**
     * Pre-fetch Learning Dashboard
     * Matches default state in: src/app/(dashboard)/learning/page.tsx
     */
    const prefetchLearning = useCallback(async () => {
        // 1. Stats
        queryClient.prefetchQuery({
            queryKey: ['learning', 'stats'],
            queryFn: () => api.get('/learning/stats').then(res => res.data),
            staleTime: 5 * 60 * 1000,
        });

        // 2. History
        queryClient.prefetchQuery({
            queryKey: ['learning', 'history'],
            queryFn: () => api.get('/learning/history').then(res => res.data),
            staleTime: 1 * 60 * 1000,
        });

        // 3. Modules (Default: Newest)
        const defaultSearch = '';
        const defaultSort = 'newest';

        queryClient.prefetchQuery({
            queryKey: ['learning', 'modules', { search: defaultSearch, sort: defaultSort }],
            queryFn: () => api.get('/learning/modules', {
                params: {
                    search: defaultSearch,
                    sort: defaultSort
                }
            }).then(res => res.data),
            staleTime: 5 * 60 * 1000, // Assuming similar stale time logic or default
        });
    }, [queryClient]);

    /**
     * Pre-fetch Practice Dashboard
     * Matches default state in: src/app/(dashboard)/practice/page.tsx
     */
    const prefetchPractice = useCallback(async () => {
        // 1. Stats
        queryClient.prefetchQuery({
            queryKey: ['practice', 'stats'],
            queryFn: () => api.get('/practice/stats').then(res => res.data),
            staleTime: 5 * 60 * 1000,
        });

        // 2. History
        queryClient.prefetchQuery({
            queryKey: ['practice', 'history'],
            queryFn: () => api.get('/practice/history').then(res => res.data),
            staleTime: 5 * 60 * 1000,
        });
    }, [queryClient]);

    /**
     * Master function to pre-fetch everything (e.g., on dashboard mount).
     * Uses slight delays to avoid clogging the network immediately.
     */
    const prefetchAll = useCallback(() => {
        const idleCallback = (window as any).requestIdleCallback || ((cb: Function) => setTimeout(cb, 1));

        idleCallback(() => {
            setTimeout(() => prefetchVocabulary(), 0);
            setTimeout(() => prefetchLearning(), 200);
            setTimeout(() => prefetchPractice(), 400);
        });
    }, [prefetchVocabulary, prefetchLearning, prefetchPractice]);

    /**
     * Pre-fetch specific page based on route (Hover strategy).
     */
    const prefetchPage = useCallback((route: string) => {
        if (route.startsWith('/vocabulary')) prefetchVocabulary();
        if (route.startsWith('/learning')) prefetchLearning();
        if (route.startsWith('/practice')) prefetchPractice();
    }, [prefetchVocabulary, prefetchLearning, prefetchPractice]);

    return { prefetchAll, prefetchPage };
};
