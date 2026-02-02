'use client';

import { useState } from 'react';
import { ContentBlock } from '@/types/learning';
import { Volume2, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useStreakStore } from '@/stores/streakStore';

interface VocabularyBlockProps {
    block: ContentBlock;
    isCompleted?: boolean;
    onBlockComplete?: (id: number, correct: boolean) => void;
}

export default function VocabularyBlock({ block, isCompleted = false, onBlockComplete }: VocabularyBlockProps) {
    const { word, translation, example_sentence, pronunciation } = block.content;
    const [saved, setSaved] = useState(isCompleted);
    const [loading, setLoading] = useState(false);

    const handlePlayAudio = () => {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    };

    const handleSave = async () => {
        if (saved || loading) return;
        setLoading(true);
        try {
            // Assuming this endpoint checks existence and adds if new
            await api.post('/vocabularies/quick-add', {
                english_word: word,
                translation: translation,
                example_sentence: example_sentence
                // Add tag or source?
            });
            setSaved(true);
            // Notify parent of completion
            if (onBlockComplete) {
                onBlockComplete(block.id, true);
            }
            // Update streak in real-time
            useStreakStore.getState().fetchStatus();
        } catch (error) {
            console.error("Failed to save vocabulary", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="my-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow animate-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePlayAudio}
                        className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors flex-shrink-0"
                    >
                        <Volume2 size={24} />
                    </button>

                    <div>
                        <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                            {word}
                            {pronunciation && <span className="text-sm font-normal text-slate-400 font-mono">{pronunciation}</span>}
                        </h3>
                        <p className="text-lg text-slate-600 font-medium">{translation}</p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saved || loading}
                    className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all w-full sm:w-auto justify-center",
                        saved
                            ? "bg-emerald-100 text-emerald-700 cursor-default"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    ) : saved ? (
                        <>
                            <Check size={18} />
                            Saved
                        </>
                    ) : (
                        <>
                            <Plus size={18} />
                            Add to List
                        </>
                    )}
                </button>
            </div>

            {example_sentence && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                    <p className="text-slate-500 italic text-sm mb-1">Example</p>
                    <p className="text-slate-700 font-medium leading-relaxed">"{example_sentence}"</p>
                </div>
            )}
        </div>
    );
}
