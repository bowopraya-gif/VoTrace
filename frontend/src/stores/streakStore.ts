import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import { StreakStatus } from '@/types/streak';

interface StreakState {
    status: StreakStatus | null;
    isLoading: boolean;
    popupShown: boolean;
    fetchStatus: () => Promise<void>;
    markPopupShown: () => void;
    incrementOptimistically: () => void;
}

export const useStreakStore = create<StreakState>()(
    persist(
        (set, get) => ({
            status: null,
            isLoading: true,
            popupShown: false,

            fetchStatus: async () => {
                // Don't set isLoading true if we already have status (from persist)
                // This prevents UI flicker
                if (!get().status) {
                    set({ isLoading: true });
                }

                try {
                    const res = await api.get('/streak');
                    set({ status: res.data, isLoading: false });
                } catch (error) {
                    console.error('Failed to fetch streak status', error);
                    set({ isLoading: false });
                }
            },

            markPopupShown: () => {
                set({ popupShown: true });
                if (typeof window !== 'undefined') {
                    localStorage.setItem('streak_popup_date', new Date().toDateString());
                }
            },

            incrementOptimistically: () => {
                const current = get().status;
                if (!current) return;

                // Create optimistic state
                // If already added today, don't increment streak count, just ensure active
                // If NOT added today, increment streak
                const shouldIncrement = !current.added_today;

                const newStreak = shouldIncrement ? current.current_streak + 1 : current.current_streak;
                const newTotal = shouldIncrement ? current.total_active_days + 1 : current.total_active_days;
                const newLongest = newStreak > current.longest_streak ? newStreak : current.longest_streak;

                set({
                    status: {
                        ...current,
                        current_streak: newStreak,
                        longest_streak: newLongest,
                        total_active_days: newTotal,
                        added_today: true,
                        is_active: true,
                        last_activity_date: new Date().toISOString().split('T')[0]
                    }
                });
            }
        }),
        {
            name: 'streak-storage', // name of the item in the storage (must be unique)
            partialize: (state) => ({ status: state.status, popupShown: state.popupShown }), // persist status
        }
    )
);
