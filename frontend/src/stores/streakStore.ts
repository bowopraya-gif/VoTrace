import { create } from 'zustand';
import api from '@/lib/api';
import { StreakStatus } from '@/types/streak';

interface StreakState {
    status: StreakStatus | null;
    isLoading: boolean;
    popupShown: boolean;
    fetchStatus: () => Promise<void>;
    markPopupShown: () => void;
}

export const useStreakStore = create<StreakState>((set) => ({
    status: null,
    isLoading: true,
    popupShown: false,

    fetchStatus: async () => {
        set({ isLoading: true });
        try {
            const res = await api.get('/streak');
            set({ status: res.data });
        } catch (error) {
            console.error('Failed to fetch streak status', error);
        } finally {
            set({ isLoading: false });
        }
    },

    markPopupShown: () => {
        set({ popupShown: true });
        localStorage.setItem('streak_popup_date', new Date().toDateString());
    },
}));
