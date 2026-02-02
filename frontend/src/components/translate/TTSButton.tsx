"use client";

import { Volume2, Square } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TTSButtonProps {
    text: string;
    lang: string;
}

export default function TTSButton({ text, lang }: TTSButtonProps) {
    const [isPlaying, setIsPlaying] = useState(false);

    // Cancel speech when component unmounts or text changes
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
        };
    }, [text]);

    const handleSpeak = () => {
        if (!text) return;

        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);

        // Map simplified codes to region-specific if possible (simplified)
        // Browsers handle 'en', 'id', 'es' usually well.
        utterance.lang = lang;

        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);

        setIsPlaying(true);
        window.speechSynthesis.speak(utterance);
    };

    return (
        <button
            onClick={handleSpeak}
            disabled={!text}
            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Listen"
        >
            {isPlaying ? <Square size={20} fill="currentColor" /> : <Volume2 size={20} />}
        </button>
    );
}
