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

        <div className="my-6 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 animate-in slide-in-from-bottom-4 duration-500 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-6 leading-relaxed">
                {question}
            </h3>

            <div className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={submitted}
                    placeholder="Type your answer here..."
                    className={cn(
                        "w-full px-4 py-3 md:py-4 rounded-xl border-2 font-medium text-base md:text-lg outline-none transition-all shadow-sm",
                        submitted
                            ? isCorrect
                                ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                                : "bg-red-50 border-red-500 text-red-800"
                            : "bg-white border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-slate-400"
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
                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    {hint ? (
                        <p className="text-sm text-slate-500 italic w-full sm:w-auto">
                            Hint: {hint}
                        </p>
                    ) : <div />}

                    <button
                        onClick={checkAnswer}
                        disabled={!input.trim()}
                        className="w-full sm:w-auto px-12 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
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
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 text-slate-700 text-sm">
                            <span className="font-bold uppercase tracking-wider text-xs block mb-1 text-primary">Explanation</span>
                            {explanation}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

}
