export type PartOfSpeech =
    | 'noun' | 'verb' | 'adjective' | 'adverb'
    | 'pronoun' | 'preposition' | 'conjunction'
    | 'interjection' | 'determiner' | 'modal'
    | 'verb phrase' | 'phrasal verb' | 'idiom'
    | 'expression' | 'slang' | 'phrase' | 'other';

export type LearningStatus = 'learning' | 'review' | 'mastered';

export interface ExampleSentence {
    id?: number;
    sentence: string;
    translation?: string;
}

export interface Vocabulary {
    id?: number;
    uuid?: string; // Add public UUID
    user_id?: number;
    english_word: string;
    pronunciation?: string;
    translation: string;
    part_of_speech: PartOfSpeech;
    learning_status: LearningStatus;
    usage_note?: string;
    personal_notes?: string;
    example_sentences: ExampleSentence[];
    audio_url?: string | null;
    audio_hash?: string | null;
    audio_status?: 'pending' | 'generating' | 'ready' | 'failed' | null;
    created_at?: string;
    updated_at?: string;
}

export const PART_OF_SPEECH_OPTIONS: { value: PartOfSpeech; label: string }[] = [
    { value: 'noun', label: 'Noun' },
    { value: 'verb', label: 'Verb' },
    { value: 'adjective', label: 'Adjective' },
    { value: 'adverb', label: 'Adverb' },
    { value: 'pronoun', label: 'Pronoun' },
    { value: 'preposition', label: 'Preposition' },
    { value: 'conjunction', label: 'Conjunction' },
    { value: 'interjection', label: 'Interjection' },
    { value: 'determiner', label: 'Determiner' },
    { value: 'modal', label: 'Modal' },
    { value: 'verb phrase', label: 'Verb Phrase' },
    { value: 'phrasal verb', label: 'Phrasal Verb' },
    { value: 'idiom', label: 'Idiom' },
    { value: 'expression', label: 'Expression' },
    { value: 'slang', label: 'Slang' },
];

export const LEARNING_STATUS_OPTIONS: { value: LearningStatus; label: string; color: string }[] = [
    { value: 'learning', label: 'Learning', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'review', label: 'Review', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    { value: 'mastered', label: 'Mastered', color: 'bg-green-100 text-green-800 border-green-200' },
];
