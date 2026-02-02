"use client";

import { useEffect, useState, memo } from 'react';
import { PracticeQuestion } from '@/types/practice';
import { cn } from '@/lib/utils';
import { Check, X, ArrowRight, SkipForward, Keyboard } from 'lucide-react';

interface MultipleChoiceQuestionProps {
    question: PracticeQuestion;
    onAnswer: (answer: string) => void;
    onSkip?: () => void;
    disabled: boolean;
    feedback?: {
        isCorrect: boolean;
        correctAnswer: string;
    } | null;
}

function MultipleChoiceQuestion({
    question,
    onAnswer,
    onSkip,
    disabled,
    feedback
}: MultipleChoiceQuestionProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    // Defensive check
    if (!question) return null;

    // Reset selection when question changes
    useEffect(() => {
        setSelectedOption(null);
    }, [question.id]);

    const handleOptionClick = (option: string) => {
        if (disabled) return;
        setSelectedOption(option);
        onAnswer(option);
    };

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (disabled) return;

            const key = parseInt(e.key);
            if (key >= 1 && key <= 4) {
                const index = key - 1;
                if (question.options[index]) {
                    e.preventDefault(); // Prevent scrolling or other browser actions
                    handleOptionClick(question.options[index]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [disabled, question, onAnswer]);

    const getOptionLabel = (index: number) => {
        return String.fromCharCode(65 + index); // A, B, C, D
    };

    return (
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
            {/* Question Card */}
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden relative p-8 md:p-12 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 leading-tight">
                    {question.question_text}
                </h2>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {question.options.map((option, index) => {
                    const isSelected = selectedOption === option;

                    let status: 'neutral' | 'correct' | 'wrong' | 'dimmed' = 'neutral';

                    if (feedback) {
                        if (option === feedback.correctAnswer) {
                            status = 'correct';
                        } else if (isSelected && !feedback.isCorrect) {
                            status = 'wrong';
                        } else {
                            status = 'dimmed';
                        }
                    } else if (isSelected) {
                        status = 'neutral';
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => handleOptionClick(option)}
                            disabled={disabled}
                            className={cn(
                                "group relative flex md:flex-row items-center p-4 rounded-xl border-2 text-left transition-all duration-200 outline-none h-full",
                                // Base styles
                                "bg-white shadow-sm hover:shadow-md",
                                // Status specific styles
                                status === 'neutral' && "border-slate-200 hover:border-primary/50",
                                status === 'correct' && "border-emerald-500 bg-emerald-50",
                                status === 'wrong' && "border-red-500 bg-red-50",
                                status === 'dimmed' && "border-slate-100 opacity-50 grayscale",
                                // Disabled state
                                disabled && status === 'neutral' && "opacity-60 cursor-not-allowed"
                            )}
                        >
                            {/* Label Box (A, B, C...) */}
                            <div className={cn(
                                "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold mr-3 transition-colors",
                                status === 'neutral' && "bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary",
                                status === 'correct' && "bg-emerald-200 text-emerald-700",
                                status === 'wrong' && "bg-red-200 text-red-700",
                                status === 'dimmed' && "bg-slate-50 text-slate-300"
                            )}>
                                {getOptionLabel(index)}
                            </div>

                            {/* Option Text */}
                            <span className={cn(
                                "flex-grow text-sm md:text-base font-medium break-words leading-tight",
                                status === 'neutral' && "text-slate-700",
                                status === 'correct' && "text-emerald-800",
                                status === 'wrong' && "text-red-800",
                                status === 'dimmed' && "text-slate-400"
                            )}>
                                {option}
                            </span>

                            {/* Icons are tricky in narrow columns, keep it simple for now or overlay */}
                            {status === 'correct' && (
                                <div className="absolute top-2 right-2 md:static md:ml-auto">
                                    <Check className="w-5 h-5 text-emerald-600 animate-in zoom-in duration-300" />
                                </div>
                            )}
                            {status === 'wrong' && (
                                <div className="absolute top-2 right-2 md:static md:ml-auto">
                                    <X className="w-5 h-5 text-red-600 animate-in zoom-in duration-300" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Skip Button - Only show if not answering/feedback */}
            {!feedback && onSkip && (
                <div className="flex justify-between items-center pt-4">
                    <button
                        onClick={onSkip}
                        disabled={disabled}
                        className="text-slate-500 hover:text-slate-700 font-bold text-sm flex items-center gap-2 transition-colors px-6 py-3 bg-slate-100 rounded-xl hover:bg-slate-200"
                    >
                        <SkipForward size={16} fill="currentColor" /> Skip Question
                    </button>

                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-400 font-medium">
                        <Keyboard size={14} />
                        Press <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">1-4</span> to select
                    </div>
                </div>
            )}
        </div>
    );
}

export default memo(MultipleChoiceQuestion);
