
"use client";

import { ChevronDown } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/types/translate';

interface TranslatePanelHeaderProps {
    selectedLang: string;
    onLangChange: (code: string) => void;
    theme: 'dark' | 'light';
    leftActions?: React.ReactNode;
    rightActions?: React.ReactNode;
    // Legacy props for backward compatibility during refactor, though we should clean them up
    // actions?: React.ReactNode;
    // actionsPosition?: 'left' | 'right';
    className?: string;
}

export default function TranslatePanelHeader({
    selectedLang,
    onLangChange,
    theme,
    leftActions,
    rightActions,
    className = ''
}: TranslatePanelHeaderProps) {
    const isDark = theme === 'dark';
    const textColor = isDark ? 'text-white' : 'text-[#101d23]';

    return (
        <header className={`relative flex items-center justify-center mb-8 md:mb-12 z-20 h-10 md:h-12 w-full ${className}`}>

            {/* Actions (Left) - Absolute or Flex? 
                User wants: [Copy] Language [TTS] layout.
                If we use flex justify-between, it handles the split automatically.
            */}

            <div className="flex-1 flex justify-start items-center gap-1 md:gap-2 min-w-[48px]">
                {leftActions}
            </div>

            {/* Centered Language Selector */}
            <div className="relative flex items-center justify-center flex-shrink-0 mx-2">
                <div className="relative group flex items-center gap-1 cursor-pointer">
                    <select
                        value={selectedLang}
                        onChange={(e) => onLangChange(e.target.value)}
                        className={`appearance-none bg-transparent ${textColor} text-xl md:text-3xl font-light cursor-pointer focus:outline-none hover:text-[#0da6f2] transition-colors text-center z-10 w-full`}
                    >
                        {SUPPORTED_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code} className="text-slate-800 bg-white">
                                {lang.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        size={16}
                        className={`pointer-events-none ${isDark ? 'text-white/50' : 'text-gray-400'} group-hover:text-[#0da6f2] transition-colors`}
                    />
                </div>
            </div>

            {/* Actions (Right) */}
            <div className="flex-1 flex justify-end items-center gap-1 md:gap-2 min-w-[48px]">
                {rightActions}
            </div>
        </header>
    );
}
