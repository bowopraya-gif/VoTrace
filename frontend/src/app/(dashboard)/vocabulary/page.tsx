'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '@/lib/api';
import { VocabularyFilters } from '@/components/vocabulary/VocabularyFilters';
import { VocabularyTable } from '@/components/vocabulary/VocabularyTable';
import { Sort } from '@/stores/vocabularyStore';

export default function VocabularyListPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuthStore();

    // Local State for Query Params
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ search: '', status: '', pos: '' });
    const [sort, setSort] = useState<Sort>({ column: 'created_at', order: 'desc' });

    // TanStack Query
    const { data: response, isLoading, isPlaceholderData } = useQuery({
        queryKey: ['vocabularies', { page, ...filters, ...sort }],
        queryFn: async () => {
            const params = {
                page,
                search: filters.search,
                status: filters.status,
                pos: filters.pos,
                sort: sort.column,
                order: sort.order,
            };
            const res = await api.get('/vocabularies', { params });
            return res.data;
        },
        enabled: !!user,
        placeholderData: keepPreviousData, // Smooth transitions
        staleTime: 2 * 60 * 1000, // 2 minutes cache
    });

    if (authLoading) return <LoadingSpinner />;
    if (!user) {
        router.push('/login');
        return null;
    }

    const vocabularies = response?.data || [];
    // Laravel Resource Collection returns: { data: [...], meta: { current_page, last_page, ... }, links: {...} }
    const pagination = {
        current_page: response?.meta?.current_page || response?.current_page || 1,
        last_page: response?.meta?.last_page || response?.last_page || 1,
        total: response?.meta?.total || response?.total || 0,
        per_page: response?.meta?.per_page || response?.per_page || 10,
    };

    const handleFilterChange = (newFilters: any) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPage(1);
    };

    const handleSortChange = (column: string, order: 'asc' | 'desc') => {
        setSort({ column, order });
        setPage(1);
    };

    const handleClear = () => {
        setFilters({ search: '', status: '', pos: '' });
        setPage(1);
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                    <VocabularyFilters
                        filters={filters}
                        sort={sort}
                        onFilterChange={handleFilterChange}
                        onSortChange={handleSortChange}
                        onClear={handleClear}
                    />
                    <VocabularyTable
                        vocabularies={vocabularies}
                        pagination={pagination}
                        sort={sort}
                        filters={filters}
                        isLoading={isLoading || isPlaceholderData}
                        onSort={(col) => handleSortChange(col, sort.column === col && sort.order === 'asc' ? 'desc' : 'asc')}
                        onPageChange={setPage}
                    />
                </div>
            </div>
        </div>
    );
}

function LoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50/50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );
}
