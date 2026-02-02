'use client';

import { useState } from 'react';
import { ContentBlock } from '@/types/learning';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle } from 'lucide-react';

interface QuizMCBlockProps {
    block: ContentBlock;
    isCompleted?: boolean;
    onComplete: (isCorrect: boolean) => void;
}

export default function QuizMCBlock({ block, isCompleted = false, onComplete }: QuizMCBlockProps) {
    const { question, options, correct_index, explanation } = block.content;
    const [selected, setSelected] = useState<number | null>(isCompleted ? correct_index : null);
    const [submitted, setSubmitted] = useState(isCompleted);

    const handleSelect = (idx: number) => {
        if (submitted) return;
        setSelected(idx);
    };

    const handleSubmit = () => {
        if (selected === null || submitted) return;
        setSubmitted(true);
        const isCorrect = selected === correct_index;
        onComplete(isCorrect);
    };

    return (
        <div className="my-8 bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 md:p-8 animate-in slide-in-from-bottom-4 duration-500">
            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg uppercase tracking-wider mb-4">
                Quiz
            </span>

            <h3 className="text-xl font-bold text-slate-800 mb-6 leading-relaxed">
                {question}
            </h3>

            <div className="space-y-3">
                {options.map((opt: string, idx: number) => {
                    let statusClass = "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm";

                    if (submitted) {
                        if (idx === correct_index) {
                            statusClass = "bg-emerald-100 border-emerald-500 text-emerald-800 shadow-md ring-1 ring-emerald-500";
                        } else if (idx === selected && selected !== correct_index) {
                            statusClass = "bg-red-100 border-red-500 text-red-800 opacity-60";
                        } else {
                            statusClass = "opacity-50";
                        }
                    } else if (selected === idx) {
                        statusClass = "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-md ring-1 ring-indigo-500";
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => handleSelect(idx)}
                            disabled={submitted}
                            className={cn(
                                "w-full text-left p-4 rounded-xl border-2 font-bold transition-all duration-200 flex items-center justify-between group",
                                statusClass
                            )}
                        >
                            <span>{opt}</span>
                            {submitted && idx === correct_index && <CheckCircle className="text-emerald-600 animate-in zoom-in" />}
                            {submitted && idx === selected && idx !== correct_index && <XCircle className="text-red-600 animate-in zoom-in" />}
                        </button>
                    );
                })}
            </div>

            {!submitted && (
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={selected === null}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
                    >
                        Check Answer
                    </button>
                </div>
            )}

            {submitted && explanation && (
                <div className="mt-6 p-4 bg-white rounded-xl border border-indigo-100 text-indigo-800 text-sm animate-in fade-in slide-in-from-top-2">
                    <span className="font-bold uppercase tracking-wider text-xs block mb-1 text-indigo-400">Explanation</span>
                    {explanation}
                </div>
            )}
        </div>
    );
}
