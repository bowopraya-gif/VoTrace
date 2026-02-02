"use client";

import { Language, SUPPORTED_LANGUAGES } from '@/types/translate';
import { ArrowRightLeft } from 'lucide-react';

interface LanguageSelectorProps {
    sourceLang: string;
    targetLang: string;
    onSourceChange: (code: string) => void;
    onTargetChange: (code: string) => void;
    onSwap: () => void;
}

export default function LanguageSelector({
    sourceLang,
    targetLang,
    onSourceChange,
    onTargetChange,
    onSwap
}: LanguageSelectorProps) {
    return (
        <div className="flex items-center justify-between gap-2 md:gap-4 bg-[#0A56C8] p-2 rounded-xl shadow-lg shadow-blue-200/50 mb-6 transition-transform hover:scale-[1.01]">

            {/* Source Language */}
            <div className="flex-1 relative">
                <select
                    value={sourceLang}
                    onChange={(e) => onSourceChange(e.target.value)}
                    className="w-full p-3 bg-transparent font-bold text-white hover:bg-white/10 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/30 appearance-none text-center md:text-left transition-colors"
                >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={`source-${lang.code}`} value={lang.code} className="text-slate-800 bg-white">
                            {lang.name}
                        </option>
                    ))}
                </select>
                {/* Custom Arrow Indicator (Optional, but browser default is okay for mobile) */}
            </div>

            {/* Swap Button */}
            <button
                onClick={onSwap}
                className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 active:bg-white/30 transition-all active:scale-95 active:rotate-180"
                title="Swap Languages"
            >
                <ArrowRightLeft size={20} />
            </button>

            {/* Target Language */}
            <div className="flex-1 relative">
                <select
                    value={targetLang}
                    onChange={(e) => onTargetChange(e.target.value)}
                    className="w-full p-3 bg-transparent font-bold text-white hover:bg-white/10 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/30 appearance-none text-center md:text-right transition-colors"
                >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={`target-${lang.code}`} value={lang.code} className="text-slate-800 bg-white">
                            {lang.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
