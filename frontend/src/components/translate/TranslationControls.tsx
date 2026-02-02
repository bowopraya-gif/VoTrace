
"use client";

import { ArrowRightLeft } from 'lucide-react';

interface TranslationControlsProps {
    onSwap: () => void;
}

export default function TranslationControls({
    onSwap
}: TranslationControlsProps) {
    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-4">
            <div className="flex flex-col items-center bg-[#182b34]/90 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)]">
                {/* Swap Button */}
                <button
                    onClick={onSwap}
                    aria-label="Swap Languages"
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-[#0da6f2] hover:text-white hover:scale-110 active:scale-95 transition-all duration-300 group relative"
                >
                    <ArrowRightLeft size={20} className="transition-transform group-hover:rotate-180" />
                </button>
            </div>
        </div>
    );
}
