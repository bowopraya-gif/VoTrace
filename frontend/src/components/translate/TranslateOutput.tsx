"use client";

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import TTSButton from './TTSButton';

interface TranslateOutputProps {
    value: string;
    lang: string;
    isLoading: boolean;
}

export default function TranslateOutput({
    value,
    lang,
    isLoading,
    error // Add error prop to interface if needed, or ignore
}: TranslateOutputProps & { error?: string | null }) {
    return (
        <div className="relative flex-1 flex flex-col h-full overflow-hidden">
            <div className="w-full h-full overflow-y-auto no-scrollbar pr-4">
                {isLoading ? (
                    <div className="space-y-4 animate-pulse pt-2 flex flex-col items-end">
                        <div className="h-8 bg-slate-200/80 rounded w-3/4"></div>
                        <div className="h-8 bg-slate-200/80 rounded w-1/2"></div>
                        <div className="h-8 bg-slate-200/80 rounded w-2/3"></div>
                    </div>
                ) : value ? (
                    <>
                        <p className="text-[#101d23] text-4xl md:text-5xl lg:text-6xl font-light leading-tight animate-in fade-in duration-500 break-words text-right">
                            {value}
                            {/* Blinking cursor simulation if needed, or just static text */}
                        </p>
                        {/* Phonetic placeholder if available in future */}
                        {/* <p className="mt-8 text-gray-400 text-xl font-light">...</p> */}
                    </>
                ) : (
                    <div className="h-full flex flex-col items-end justify-start pt-0 text-slate-300/50">
                        <p className="text-4xl md:text-5xl lg:text-6xl font-extralight text-right w-full">Translation</p>
                    </div>
                )}
            </div>

            <div className="absolute bottom-0 left-0 w-full pb-6 pt-12 bg-gradient-to-t from-[#f5f7f8] to-transparent pointer-events-none flex justify-end items-end text-gray-400 text-sm font-medium">
                {value && (
                    <span className="flex items-center gap-1">
                        <Check size={16} />
                        Translated
                    </span>
                )}
            </div>
        </div>
    );
}
