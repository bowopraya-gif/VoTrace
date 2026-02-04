'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { ListeningQuestion as ListeningQuestionType, TypoTolerance } from '@/types/practice';
import { validateAnswer, getVisualDiff } from '@/lib/answerValidator';
import { cn } from '@/lib/utils';
import { Send, Lightbulb, Volume2 } from 'lucide-react';
import AudioPlayer from './AudioPlayer';

interface ListeningQuestionProps {
    question: ListeningQuestionType;
    onAnswer: (userAnswer: string, isCorrect: boolean, correctAnswer: string) => void;
    onSkip?: () => void;
    disabled: boolean;
    feedback?: {
        isCorrect: boolean;
        userAnswer: string;
        correctAnswer: string;
    } | null;
    tolerance: TypoTolerance;
}

function ListeningQuestion({
    question,
    onAnswer,
    onSkip,
    disabled,
    feedback,
    tolerance
}: ListeningQuestionProps) {
    const [input, setInput] = useState('');
    const [hintCount, setHintCount] = useState(0);
    const [hintText, setHintText] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset state when question changes
    useEffect(() => {
        setInput('');
        setHintCount(0);
        setHintText('');
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 300);
        return () => clearTimeout(timer);
    }, [question.id]);

    const handleHint = () => {
        if (disabled) return;

        const answer = question.correct_answer;
        const nextCount = hintCount + 1;
        const charsToShow = nextCount * 1;

        setHintCount(nextCount);
        setHintText(answer.substring(0, Math.min(charsToShow, answer.length)));
        inputRef.current?.focus();
    };

    const handleSubmit = () => {
        if (disabled || !input.trim()) return;
        const { isCorrect, matchedAnswer } = validateAnswer(input, question.correct_answer, tolerance);
        onAnswer(input, isCorrect, matchedAnswer);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    const feedbackTokens = feedback
        ? getVisualDiff(feedback.userAnswer, feedback.correctAnswer)
        : [];

    // Relaxed check: If we have a URL, assume it's playable. Status check strictness was causing issues.
    const hasAudio = !!question.audio_url;

    // Prepare words with hint visibility logic
    const words = question.question_text.split(' ');
    let globalCharIndex = 0;
    const wordsWithHints = words.map(word => {
        const chars = word.split('').map((char) => {
            const isRevealed = globalCharIndex < hintText.length;
            globalCharIndex++;
            return { char, isRevealed };
        });
        globalCharIndex++; // Count the space between words
        return chars;
    });

    return (
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
            {/* Question Card */}
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden relative p-8 md:p-12 text-center">

                {/* Audio Player */}
                <div className="flex justify-center mb-6">
                    {hasAudio ? (
                        <AudioPlayer
                            src={question.audio_url!}
                            autoPlay={!disabled}
                            disabled={disabled}
                        />
                    ) : (
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2 text-amber-600">
                            <Volume2 size={24} />
                            <span className="font-medium">Audio Unavailable</span>
                        </div>
                    )}
                </div>

                {/* Masked Words OR Translation Feedback */}
                <div className="min-h-[3rem] flex items-center justify-center">
                    {feedback ? (
                        // Feedback State: Show Translation with Label
                        <div className="animate-in fade-in zoom-in-50">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Translation
                            </p>
                            <h3 className="text-3xl font-bold text-slate-800">
                                {question.translation}
                            </h3>
                        </div>
                    ) : (
                        // Normal State: Show Underscores / Hints
                        <div className="flex flex-wrap justify-center gap-4 mt-6 animate-in fade-in zoom-in-50 duration-500">
                            {wordsWithHints.map((word, i) => (
                                <div key={i} className="flex gap-1 items-end h-8">
                                    {word.map((item, j) => (
                                        item.isRevealed || item.char === '/' ? (
                                            <span key={j} className="w-8 text-center text-2xl font-bold text-slate-800 border-b-2 border-slate-300 pb-0 leading-none">
                                                {item.char}
                                            </span>
                                        ) : (
                                            <span
                                                key={j}
                                                className="w-8 h-1 bg-slate-200 rounded-full inline-block mb-1"
                                            />
                                        )
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {!feedback && (
                    <p className="text-slate-400 text-sm font-medium mt-4 uppercase tracking-widest">
                        Type what you hear
                    </p>
                )}
            </div>

            {/* Input Area */}
            <div className="max-w-xl mx-auto space-y-4">
                <div className="relative group">
                    {feedback ? (
                        <div className={cn(
                            "w-full text-center text-2xl md:text-3xl font-bold p-6 rounded-2xl border-2 transition-all outline-none flex items-center justify-center gap-[1px] font-mono",
                            feedback.isCorrect
                                ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                                : "bg-red-50 border-red-500 text-red-700"
                        )}>
                            {feedbackTokens.map((token, idx) => (
                                <span
                                    key={idx}
                                    className={
                                        token.status === 'correct' ? 'text-emerald-600' :
                                            token.status === 'missing' ? 'text-red-500 border-b-2 border-red-500 min-w-[12px]' :
                                                'text-red-600'
                                    }
                                >
                                    {token.char}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={disabled}
                            placeholder={hintText ? `${hintText}...` : "Type exactly what you hear..."}
                            className={cn(
                                "w-full text-center text-2xl md:text-3xl font-bold p-6 rounded-2xl border-2 transition-all outline-none",
                                "bg-white text-slate-800 placeholder:text-slate-300",
                                !feedback && "border-slate-200 focus:border-primary focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)]",
                                disabled && "opacity-80"
                            )}
                            autoCapitalize="off"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                        />
                    )}

                    {!disabled && input.length > 0 && !feedback && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 text-xs font-bold text-slate-300 pointer-events-none animate-in fade-in">
                            <span>Hit Enter</span>
                            <div className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center bg-slate-50">⏎</div>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center px-2">
                    <button
                        onClick={handleHint}
                        disabled={disabled || hintText.length >= question.correct_answer.length}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                            "text-amber-600 bg-amber-50 hover:bg-amber-100",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Lightbulb size={18} />
                        <span>Hint ({hintCount})</span>
                    </button>

                    {onSkip && !feedback && (
                        <button
                            onClick={onSkip}
                            disabled={disabled}
                            className="text-slate-400 hover:text-slate-600 font-bold text-sm px-4 py-2"
                        >
                            Don't know?
                        </button>
                    )}

                    <button
                        onClick={() => handleSubmit()}
                        disabled={disabled || !input.trim()}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95",
                            "bg-primary hover:bg-primary/90 shadow-primary/20",
                            (disabled || !input.trim()) && "opacity-50 cursor-not-allowed shadow-none"
                        )}
                    >
                        <span>Submit</span>
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default memo(ListeningQuestion);
