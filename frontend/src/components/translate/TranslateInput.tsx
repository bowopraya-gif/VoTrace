"use client";

import { X } from 'lucide-react';
import TTSButton from './TTSButton';

interface TranslateInputProps {
    value: string;
    onChange: (text: string) => void;
    onClear: () => void;
    lang: string;
    maxChars?: number;
}

export default function TranslateInput({
    value,
    onChange,
    onClear,
    lang,
    maxChars = 5000
}: TranslateInputProps) {
    return (
        <div className="relative flex-1 flex flex-col h-full">
            <textarea
                autoFocus
                value={value}
                onChange={(e) => onChange(e.target.value.slice(0, maxChars))}
                placeholder="Type to translate..."
                className="w-full h-full bg-transparent text-white text-4xl md:text-5xl lg:text-6xl font-extralight border-none focus:ring-0 resize-none placeholder-white/20 leading-tight no-scrollbar p-0 outline-none"
                spellCheck="false"
            />

            <div className="absolute bottom-0 left-0 w-full pb-6 bg-gradient-to-t from-[#101c22] to-transparent pt-12 pointer-events-none flex justify-between items-end text-white/30 text-sm font-medium">
                <span>{value.length} / {maxChars}</span>

                {value && (
                    <button
                        onClick={onClear}
                        className="pointer-events-auto hover:text-white transition-colors flex items-center gap-2"
                    >
                        <X size={18} />
                        <span>Clear</span>
                    </button>
                )}
            </div>
        </div>
    );
}
