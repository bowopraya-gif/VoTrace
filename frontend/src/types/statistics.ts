// Statistics Types for VoTrack

export type StatsPeriod = '7d' | '30d' | 'year' | 'all';

export const PERIOD_OPTIONS: { value: StatsPeriod; label: string }[] = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All Time' },
];

// === OVERVIEW ===
export interface StatsInsight {
    type: 'growth' | 'achievement' | 'suggestion';
    message: string;
    trend?: 'up' | 'down' | 'stable';
    value?: number;
}

export interface StatsOverview {
    words_learned: number;
    consistency_rate: number;
    average_per_day: number;
    total_study_hours: number;
    insights: StatsInsight[];
}

// === VOCABULARY STATS ===
export interface VocabOverview {
    total: number;
    mastered: number;
    learning: number;
    review: number;
    mastery_rate: number;
}

export interface PosStat {
    label: string;
    value: string;
    count: number;
}

export interface SrsLevel {
    level: number;
    label: string;
    count: number;
}

export interface DueForReview {
    today: number;
    overdue: number;
    upcoming_7_days: number;
}

export interface DifficultyRange {
    range: string;
    label: string;
    count: number;
}

export interface RetentionPoint {
    days_since: number;
    retention_percent: number;
}

export interface VocabActivity {
    date: string;
    added: number;
    mastered: number;
}

export interface ImprovementWord {
    id: number;
    word: string;
    translation: string;
    times_wrong: number;
    times_correct: number;
    total_attempts: number;
    difficulty: number;
}

export interface VocabularyStats {
    overview: VocabOverview;
    by_part_of_speech: PosStat[];
    srs_breakdown: SrsLevel[];
    due_for_review: DueForReview;
    difficulty_distribution: DifficultyRange[];
    retention_curve: RetentionPoint[];
    recent_activity: VocabActivity[];
    mastered_activity: { date: string; mastered: number }[];
    daily_heatmap: { date: string; count: number }[];
    improvement_zone: ImprovementWord[];
}

// === PRACTICE STATS ===
export interface PracticeOverview {
    sessions: number;
    questions: number;
    time_mins: number;
    avg_accuracy: number;
    best_accuracy: number;
    streak: number;
}

export interface ModeStat {
    mode: string;
    sessions: number;
    accuracy: number;
}

export interface AccuracyTrendPoint {
    date: string;
    accuracy: number;
    sessions: number;
}

export interface TimeDistribution {
    hour: number;
    sessions: number;
}

export interface DirectionPerformance {
    direction: string;
    count: number;
    accuracy: number;
}

export interface HeatmapCell {
    day: number;
    week: number;
    count: number;
    date: string;
}

export interface HardestWord {
    id: number;
    english_word: string;
    translation: string;
    part_of_speech: string;
    total_attempts: number;
    correct: number;
    accuracy: number;
}

export interface RecentSession {
    id: number;
    mode: string;
    accuracy: number;
    duration: number;
    date: string;
}

export interface PracticeStats {
    overview: PracticeOverview;
    by_mode: ModeStat[];
    accuracy_trend: AccuracyTrendPoint[];
    time_distribution: TimeDistribution[];
    direction_performance: DirectionPerformance[];
    weekly_heatmap: HeatmapCell[];
    hardest_words: HardestWord[];
    recent_sessions: RecentSession[];
}

// === LEARNING STATS ===
export interface LearningOverview {
    modules_started: number;
    modules_completed: number;
    lessons_completed: number;
    lessons_in_progress: number;
    hours: number;
}

export interface ModuleProgress {
    id: number;
    slug: string;
    title: string;
    total: number;
    completed: number;
    percent: number;
    score: number;
}

export interface DailyActivityPoint {
    day: string;
    date: string;
    minutes: number;
}

export interface DailyActivity {
    week_start: string;
    week_end: string;
    week_label: string;
    data: DailyActivityPoint[];
    total_minutes: number;
}

export interface QuizPerformance {
    total: number;
    correct: number;
    accuracy: number;
}

export interface RecentLesson {
    title: string;
    module: string;
    score: number;
    status: 'completed' | 'in_progress' | 'not_started';
    progress: number;
    has_quiz: boolean;
    date: string | null;
}

export interface LearningStats {
    overview: LearningOverview;
    progress_by_module: ModuleProgress[];
    daily_activity: DailyActivity;
    activity_heatmap: { day: number; week: number; count: number; minutes: number; date: string }[];
    quiz_performance: QuizPerformance;
    recent_lessons: RecentLesson[];
}

// === DRILL DOWN ===
export interface DrillDownVocabulary {
    id: number;
    english_word: string;
    translation: string;
    part_of_speech: string;
    learning_status: string;
    difficulty_score: number | null;
}

export interface DrillDownResponse {
    current_page: number;
    data: DrillDownVocabulary[];
    last_page: number;
    per_page: number;
    total: number;
}
