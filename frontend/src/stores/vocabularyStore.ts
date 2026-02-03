import { create } from 'zustand';
import api from '@/lib/api';
import { Vocabulary } from '@/types/vocabulary';
import { useStreakStore } from '@/stores/streakStore';

interface Pagination {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

interface Filters {
    search: string;
    status: string;
    pos: string;
}

export interface Sort {
    column: string;
    order: 'asc' | 'desc';
}

interface VocabularyState {
    vocabularies: Vocabulary[];
    pagination: Pagination;
    filters: Filters;
    sort: Sort;
    isLoading: boolean;
    error: string | null;

    fetchVocabularies: (page?: number) => Promise<void>;
    addVocabulary: (data: Partial<Vocabulary>) => Promise<void>;
    updateVocabulary: (id: number, data: Partial<Vocabulary>) => Promise<void>;
    deleteVocabulary: (id: number) => Promise<void>;
    generateFromAI: (word: string) => Promise<{ status: 'success' | 'ambiguous'; data?: Partial<Vocabulary>; options?: Partial<Vocabulary>[] }>;

    setFilters: (filters: Partial<Filters>) => void;
    setSort: (column: string, order?: 'asc' | 'desc') => void;
}

export const useVocabularyStore = create<VocabularyState>((set, get) => ({
    vocabularies: [],
    pagination: { current_page: 1, last_page: 1, total: 0, per_page: 10 },
    filters: { search: '', status: '', pos: '' },
    sort: { column: 'created_at', order: 'desc' },
    isLoading: false,
    error: null,

    fetchVocabularies: async (page = 1) => {
        set({ isLoading: true, error: null });
        const { filters, sort } = get();

        try {
            const params = {
                page,
                search: filters.search,
                status: filters.status,
                pos: filters.pos,
                sort: sort.column,
                order: sort.order
            };

            const response = await api.get('/vocabularies', { params });
            const { data, ...pagination } = response.data;

            set({
                vocabularies: data,
                pagination: pagination
            });
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },

    setFilters: (newFilters) => {
        set((state) => ({
            filters: { ...state.filters, ...newFilters }
        }));
        // Debounce fetching is usually handled in UI, but triggering fetch here is also common
        // For simplicity, we'll let the UI trigger fetch after filter change
    },

    setSort: (column, order) => {
        set((state) => {
            // If order is provided, use it directly. Otherwise, toggle.
            const newOrder = order ?? (state.sort.column === column && state.sort.order === 'asc' ? 'desc' : 'asc');
            return {
                sort: { column, order: newOrder }
            };
        });
        get().fetchVocabularies(1); // Reset to page 1 on sort
    },

    addVocabulary: async (data) => {
        set({ isLoading: true, error: null });
        try {
            // Inject Timezone for accurate streak calculation
            const payload = {
                ...data,
                tz: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
            await api.post('/vocabularies', payload);
            await get().fetchVocabularies(1); // Refresh list

            // Optimistic Streak Update
            useStreakStore.getState().incrementOptimistically();
        } catch (error: any) {
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateVocabulary: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            await api.put(`/vocabularies/${id}`, data);
            await get().fetchVocabularies(get().pagination.current_page); // Refresh current page
        } catch (error: any) {
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteVocabulary: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await api.delete(`/vocabularies/${id}`);
            await get().fetchVocabularies(get().pagination.current_page);
        } catch (error: any) {
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    generateFromAI: async (word: string) => {
        const response = await api.post('/vocabularies/ai-generate', { word });
        return response.data; // Now returns { status, data|options }
    }
}));
