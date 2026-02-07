export type PracticeMode = 'multiple_choice' | 'typing' | 'listening' | 'matching' | 'mixed';

export interface PracticeModeConfig {
    mode: PracticeMode;
    label: string;
    description: string;
    color: 'blue' | 'purple' | 'emerald' | 'orange' | 'teal';
}

export const PRACTICE_MODES: PracticeModeConfig[] = [
    {
        mode: 'multiple_choice',
        label: 'Multiple Choice',
        description: 'Select the correct translation from 4 options. Best for efficient review.',
        color: 'blue'
    },
    {
        mode: 'typing',
        label: 'Typing Practice',
        description: 'Type the translation manually. Best for mastering spelling.',
        color: 'purple'
    },
    {
        mode: 'listening',
        label: 'Listening Mode',
        description: 'Listen to the pronunciation and select the word.',
        color: 'orange'
    },
    {
        mode: 'matching',
        label: 'Vocabulary Matching',
        description: 'Match words with their translations in a jumbled grid!',
        color: 'teal'
    },
    {
        mode: 'mixed',
        label: 'Mixed Mode',
        description: 'A combination of all practice types for a comprehensive challenge.',
        color: 'emerald'
    }
];

export interface PracticeQuestion {
    id: number;
    vocabulary_id: string; // UUID
    question_text: string;
    learning_status: string; // 'learning' | 'review' | 'mastered'
    options: string[];
    correct_index: number;
    part_of_speech?: string;
}

export interface PracticeSessionResult {
    id: string; // UUID
    total_questions: number;
    correct_answers: number;
    wrong_answers: number;
    accuracy: number;
    duration_seconds: number;
}

export interface PracticeSessionConfig {
    mode: PracticeMode;
    direction: 'en_to_id' | 'id_to_en';
    question_count: number;
    filters: {
        learning_status: string[];
        exclude_mastered: boolean;
        part_of_speech?: string[];
        practiced_within?: string; // 'today', 'week', 'month', 'never'
        search?: string;
    };
}

// --- Newly added types to resolve missing exports ---

export type PracticeDirection = 'en_to_id' | 'id_to_en';

export interface PracticeStats {
    words_practiced_today: number;
    words_practiced_yesterday: number;
    total_sessions: number;
    current_streak: number;
    average_accuracy: number;
    words_mastered_today: number;
    words_mastered_yesterday: number;
    words_mastered: number;
    words_learning: number;
    words_review: number;
}

export interface PracticeHistoryItem {
    id: string; // UUID
    mode: PracticeMode;
    direction: PracticeDirection;
    total_questions: number;
    correct_answers: number;
    accuracy: number;
    duration_seconds: number;
    created_at: string;
}

// Typing Mode Types
export interface TypingQuestion {
    id: number;
    vocabulary_id: string; // UUID
    question_text: string;
    correct_answer: string;
    learning_status: string;
    example_sentence?: string | null;
    part_of_speech?: string;
}

export type TypoTolerance = 'strict' | 'normal' | 'lenient';

// Listening Mode Types
export interface ListeningQuestion {
    id: number;
    vocabulary_id: string; // UUID
    audio_url: string | null;
    audio_status: 'pending' | 'generating' | 'ready' | 'failed';
    question_text: string; // Fallback if no audio
    translation: string; // Meaning of the word (shown in feedback)
    correct_answer: string;
    learning_status: string;
    part_of_speech?: string;
}

// Matching Mode Types
export interface MatchingItem {
    id: string;
    pair_id: string;
    text: string;
    type: 'source' | 'target';
}

export interface MatchingQuestion {
    id: string; // UUID for React Key
    type: 'matching';
    pair_count: number;
    items: MatchingItem[];
    vocabulary_ids: string[];
}

export interface MatchingResult {
    vocabulary_id: string;
    is_correct: boolean;
    time_spent_ms: number;
}
