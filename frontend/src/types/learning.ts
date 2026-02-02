export interface Module {
    id: number;
    title: string;
    slug: string;
    description: string;
    thumbnail_url: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    category: string;
    lessons_count: number;
    // Progress
    progress_percent?: number;
    completed_lessons_count?: number;
    is_published: boolean;
}

export interface Lesson {
    id: number;
    module_id: number;
    title: string;
    slug: string;
    description: string;
    estimated_mins: number;
    order_index: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    total_blocks: number;
    completion_criteria?: {
        min_interactive?: number;
        required_block_indices?: number[];
        required_types?: string[];
    };
    // Progress
    progress?: LessonProgress;
    user_progress?: LessonProgress; // Flattened progress for lists
    // Relations
    module?: Module;
    content_blocks?: ContentBlock[];
}

export interface LessonProgress {
    id: number;
    status: 'users' | 'in_progress' | 'completed';
    completed_blocks: number;
    completed_block_ids?: number[];
    correct_answers: number;
    score: number;
    time_spent: number;
    last_block_index: number;
    completed_at?: string;
}

export type BlockType =
    | 'text' | 'image' | 'video' | 'audio'
    | 'quiz_mc' | 'quiz_typing' | 'quiz_fill'
    | 'vocabulary' | 'link' | 'divider';

export interface ContentBlock {
    id: number;
    lesson_id: number;
    type: BlockType;
    content: any; // Typed specifically based on BlockType in renderer
    order_index: number;
    is_required: boolean;
}

export interface LearningStats {
    learned_today: number;
    learned_yesterday: number;
    modules_started: number;
    lessons_completed: number;
    learning_time_seconds: number;
}

export interface LearningActivityItem {
    id: number;
    lesson_id: number;
    status: 'not_started' | 'in_progress' | 'completed';
    completed_blocks: number;
    correct_answers: number;
    score: number;
    time_spent: number;
    last_block_index: number;
    completed_at?: string;
    updated_at: string;
    lesson: {
        id: number;
        title: string;
        slug: string;
        total_blocks: number;
        module: {
            id: number;
            title: string;
            slug: string;
        };
    };
}
