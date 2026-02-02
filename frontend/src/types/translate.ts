export interface Language {
    code: string;
    name: string;
}

export interface TranslationResult {
    translatedText: string;
    match: number;
}

export interface TranslationState {
    sourceLang: string;
    targetLang: string;
    inputText: string;
    result: TranslationResult | null;
    isLoading: boolean;
    error: string | null;
}

export const SUPPORTED_LANGUAGES: Language[] = [
    { code: 'en', name: 'English' },
    { code: 'id', name: 'Indonesian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'ar', name: 'Arabic' },
    { code: 'ru', name: 'Russian' },
];
