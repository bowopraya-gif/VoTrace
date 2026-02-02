import React from 'react';
import { Vocabulary } from '@/types/vocabulary';

interface Props {
    isOpen: boolean;
    options: Partial<Vocabulary>[];
    onSelect: (option: Partial<Vocabulary>) => void;
    onClose: () => void;
}

export function DisambiguationModal({ isOpen, options, onSelect, onClose }: Props) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                        Which meaning?
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <p className="text-slate-500 dark:text-slate-400 mb-6">
                    This word has multiple meanings. Please select the one that fits your context:
                </p>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {options.map((opt, idx) => (
                        <button
                            key={idx}
                            onClick={() => onSelect(opt)}
                            className="w-full p-4 rounded-xl border-2 border-slate-100 dark:border-slate-700
                                       hover:border-indigo-500 dark:hover:border-indigo-500 
                                       bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700/50
                                       transition-all duration-200
                                       text-left group relative overflow-hidden"
                        >
                            <div className="relative z-10 flex items-center gap-3 mb-2">
                                <span className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                    {opt.english_word}
                                </span>
                                <span className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full font-medium uppercase tracking-wide">
                                    {opt.part_of_speech}
                                </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed relative z-10">
                                {opt.translation}
                            </p>
                        </button>
                    ))}
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
