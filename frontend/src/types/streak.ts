export interface StreakStatus {
    current_streak: number;
    longest_streak: number;
    added_today: boolean;
    is_active: boolean;
    last_activity_date: string | null;
    total_active_days: number;
}

export interface StreakActivity {
    activity_date: string;
    vocabulary_count: number;
}

export interface StreakStats extends StreakStatus {
    streak_started_at: string | null;
    average_vocab_per_day: number;
    // New Fields
    this_month_count: number;
    consistency_rate: number;
}

export interface StreakHistoryItem {
    start_date: string;
    end_date: string;
    length: number;
    rank?: number; // Optional FE rank
}

export type WidgetState = 'fire' | 'frozen' | 'none';
