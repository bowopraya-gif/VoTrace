'use client';

import { useState } from 'react';
import { ContentBlock } from '@/types/learning';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Keyboard } from 'lucide-react';

interface QuizTypingBlockProps {
    block: ContentBlock;
    isCompleted?: boolean;
    onComplete: (isCorrect: boolean) => void;
}

export default function QuizTypingBlock({ block, isCompleted = false, onComplete }: QuizTypingBlockProps) {
    const { question, correct_answer, acceptable_answers, hint, explanation } = block.content;
    const [input, setInput] = useState(isCompleted ? correct_answer : '');
    const [submitted, setSubmitted] = useState(isCompleted);
    const [isCorrect, setIsCorrect] = useState(isCompleted);

    const checkAnswer = () => {
        if (submitted) return;

        const normalize = (s: string) => s.trim().toLowerCase().replace(/[.,!?;:]/g, '');
        const userAnswer = normalize(input);
        const correct = normalize(correct_answer);
        const alternatives = acceptable_answers ? acceptable_answers.map((a: string) => normalize(a)) : [];

        const correctResult = userAnswer === correct || alternatives.includes(userAnswer);

        setSubmitted(true);
        setIsCorrect(correctResult);
        onComplete(correctResult);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !submitted && input.trim()) {
            checkAnswer();
        }
    };

    return (
        <div className="my-8 bg-sky-50/50 border border-sky-100 rounded-3xl p-6 md:p-8 animate-in slide-in-from-bottom-4 duration-500">
            <span className="inline-block px-3 py-1 bg-sky-100 text-sky-700 text-xs font-bold rounded-lg uppercase tracking-wider mb-4">
                Typing Quiz
            </span>

            <h3 className="text-xl font-bold text-slate-800 mb-6 leading-relaxed">
                {question}
            </h3>

            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Keyboard size={20} />
                </div>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={submitted}
                    placeholder="Type your answer here..."
                    className={cn(
                        "w-full pl-12 pr-4 py-4 rounded-xl border-2 font-medium text-lg outline-none transition-all shadow-sm",
                        submitted
                            ? isCorrect
                                ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                                : "bg-red-50 border-red-500 text-red-800"
                            : "bg-white border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 placeholder:text-slate-400"
                    )}
                />

                {submitted && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {isCorrect ? (
                            <CheckCircle className="text-emerald-500 animate-in zoom-in" size={24} />
                        ) : (
                            <XCircle className="text-red-500 animate-in zoom-in" size={24} />
                        )}
                    </div>
                )}
            </div>

            {!submitted ? (
                <div className="mt-6 flex justify-between items-center">
                    {hint ? (
                        <p className="text-sm text-slate-500 italic">
                            Hint: {hint}
                        </p>
                    ) : <div />}

                    <button
                        onClick={checkAnswer}
                        disabled={!input.trim()}
                        className="px-8 py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 active:scale-95 transition-all shadow-lg shadow-sky-200 disabled:opacity-50 disabled:shadow-none"
                    >
                        Check Answer
                    </button>
                </div>
            ) : (
                <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2">
                    {!isCorrect && (
                        <div className="p-4 bg-red-100/50 rounded-xl border border-red-100">
                            <p className="text-xs font-bold text-red-500 uppercase mb-1">Correct Answer</p>
                            <p className="font-bold text-slate-800">{correct_answer}</p>
                        </div>
                    )}

                    {explanation && (
                        <div className="p-4 bg-white rounded-xl border border-sky-100 text-sky-800 text-sm">
                            <span className="font-bold uppercase tracking-wider text-xs block mb-1 text-sky-400">Explanation</span>
                            {explanation}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
