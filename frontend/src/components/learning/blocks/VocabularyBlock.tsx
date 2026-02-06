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

        <div className="my-6 md:my-8 bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow animate-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-3 md:gap-4">
                <button
                    onClick={handlePlayAudio}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors flex-shrink-0"
                >
                    <Volume2 className="w-5 h-5 md:w-6 md:h-6" />
                </button>

                <div>
                    <h3 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2 md:gap-3">
                        {word}
                        {pronunciation && <span className="text-xs md:text-sm font-normal text-slate-400 font-mono">{pronunciation}</span>}
                    </h3>
                    <p className="text-base md:text-lg text-slate-600 font-medium">{translation}</p>
                </div>
            </div>


            {
                example_sentence && (
                    <div className="mt-4 pt-3 md:mt-6 md:pt-4 border-t border-slate-100 mb-4">
                        <p className="text-slate-500 italic text-xs md:text-sm mb-1">Example</p>
                        <p className="text-slate-700 font-medium leading-relaxed text-sm md:text-base">"{example_sentence}"</p>
                    </div>
                )
            }

            <button
                onClick={handleSave}
                disabled={saved || loading}
                className={cn(
                    "w-full py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all justify-center mt-4",
                    saved
                        ? "bg-emerald-100 text-emerald-700 cursor-default"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
            >
                {loading ? (
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : saved ? (
                    <>
                        <Check size={16} className="md:w-[18px] md:h-[18px]" />
                        Saved
                    </>
                ) : (
                    <>
                        <Plus size={16} className="md:w-[18px] md:h-[18px]" />
                        Add to List
                    </>
                )}
            </button>
        </div >
    );

}
