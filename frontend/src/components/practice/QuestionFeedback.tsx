"use client";

import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface QuestionFeedbackProps {
    isCorrect: boolean;
    correctAnswer: string;
    onNext: () => void;
    secondsRemaining?: number;
}

export default function QuestionFeedback({
    isCorrect,
    correctAnswer,
    onNext,
    secondsRemaining
}: QuestionFeedbackProps) {
    const nextButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        // Play sound or haptic feedback here if we add that later

        if (isCorrect) {
            // Celebrate!
            const count = 200;
            const defaults = {
                origin: { y: 0.7 }
            };

            function fire(particleRatio: number, opts: any) {
                confetti({
                    ...defaults,
                    ...opts,
                    particleCount: Math.floor(count * particleRatio)
                });
            }

            fire(0.25, { spread: 26, startVelocity: 55 });
            fire(0.2, { spread: 60 });
            fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
            fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
            fire(0.1, { spread: 120, startVelocity: 45 });
        }

        // Auto-focus next button for keyboard speed
        // Add delay to prevent "Enter" key race condition (skipping feedback)
        const timer = setTimeout(() => {
            if (nextButtonRef.current) {
                nextButtonRef.current.focus();
            }
        }, 300); // 300ms delay

        return () => clearTimeout(timer);
    }, [isCorrect]);

    return (
        <div className={`
            fixed bottom-0 left-0 right-0 p-6 md:p-8 animate-in slide-in-from-bottom border-t-4 shadow-xl z-50
            ${isCorrect ? 'bg-emerald-50 border-emerald-500' : 'bg-red-50 border-red-500'}
        `}>
            {/* Countdown Progress Bar (Optional, can be subtle at top of card) */}
            {secondsRemaining !== undefined && secondsRemaining > 0 && (
                <div className="absolute top-0 left-0 h-1 bg-black/10 w-full">
                    <div
                        className="h-full bg-black/20 transition-all duration-1000 linear"
                        style={{ width: `${(secondsRemaining / 5) * 100}%` }}
                    />
                </div>
            )}

            <div className="max-w-4xl mx-auto flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 md:gap-4 flex-1">
                    <div className={`p-2 md:p-3 rounded-full flex-shrink-0 ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {isCorrect ? <CheckCircle className="w-6 h-6 md:w-8 md:h-8" /> : <XCircle className="w-6 h-6 md:w-8 md:h-8" />}
                    </div>
                    <div>
                        <h3 className={`text-lg md:text-xl font-bold ${isCorrect ? 'text-emerald-800' : 'text-red-800'}`}>
                            {isCorrect ? 'Correct!' : 'Incorrect'}
                        </h3>
                        {!isCorrect && (
                            <p className="text-red-600 text-sm md:text-base font-medium mt-0.5 md:mt-1 pr-2 leading-tight">
                                Correct: <span className="font-bold">{correctAnswer}</span>
                            </p>
                        )}
                    </div>
                </div>

                <button
                    ref={nextButtonRef}
                    onClick={onNext}
                    className={`
                        flex-shrink-0 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center gap-2
                        ${isCorrect
                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                            : 'bg-red-600 hover:bg-red-700 shadow-red-200'}
                    `}
                >
                    <span className="hidden md:inline">Continue</span>
                    {secondsRemaining !== undefined && secondsRemaining > 0 && (
                        <span>({secondsRemaining}s)</span>
                    )}
                    <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
}
