"use client";

import { useState, useEffect, useRef, memo } from 'react';
import { TypingQuestion as TypingQuestionType, TypoTolerance } from '@/types/practice';
import { validateAnswer, getVisualDiff, calculateSimilarity } from '@/lib/answerValidator';
import { cn } from '@/lib/utils';
import { Lightbulb, Send, HelpCircle, ArrowRight } from 'lucide-react';

interface TypingQuestionProps {
    question: TypingQuestionType;
    onAnswer: (userAnswer: string, isCorrect: boolean, correctAnswer: string, hintCount: number) => void;
    onSkip?: () => void;
    disabled: boolean;
    feedback?: {
        isCorrect: boolean;
        correctAnswer: string;
        userAnswer: string;
    } | null;
    tolerance: TypoTolerance;
    enableCloze?: boolean;
}

function TypingQuestion({
    question,
    onAnswer,
    onSkip,
    disabled,
    feedback,
    tolerance,
    enableCloze
}: TypingQuestionProps) {
    const [input, setInput] = useState('');
    const [hintCount, setHintCount] = useState(0);
    const [hintText, setHintText] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset state on new question
    useEffect(() => {
        setInput('');
        setHintCount(0);
        setHintText('');
        // Auto-focus input
        if (!disabled && inputRef.current) {
            inputRef.current.focus();
        }
    }, [question.id, disabled]);

    // Handle Hint
    const handleHint = () => {
        if (disabled) return;

        const answer = question.correct_answer;
        const nextCount = hintCount + 1;
        const charsToShow = nextCount * 2; // Show 2 chars per hint

        setHintCount(nextCount);
        setHintText(answer.substring(0, Math.min(charsToShow, answer.length)));

        // Refocus input
        inputRef.current?.focus();
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (disabled || !input.trim()) return;

        const { isCorrect, matchedAnswer } = validateAnswer(input, question.correct_answer, tolerance);
        onAnswer(input, isCorrect, matchedAnswer, hintCount);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    // Determine what to show as the prompt
    // If Cloze mode is enabled and we have an example sentence
    const showCloze = enableCloze && question.example_sentence;

    // Mask the target word in the sentence for Cloze display (Fuzzy Match)
    const renderClozeSentence = () => {
        if (!question.example_sentence) return null;

        const sentence = question.example_sentence;
        // Regex splits by word boundaries but keeps delimiters
        const tokens = sentence.split(/(\b|\W+)/);
        const possibleAnswers = question.correct_answer.split(/[\/,|]/).map(s => s.trim());
        const target2 = question.question_text;
        const THRESHOLD = 0.65; // Slightly higher threshold for combined phrases

        const maskedIndices = new Set<number>();

        // Sliding Window to find matches (Phrase Detection)
        // We look ahead up to 10 tokens to find robust matches for phrases or split words
        for (let i = 0; i < tokens.length; i++) {
            // Optimization: if already masked, skip
            if (maskedIndices.has(i)) continue;

            // Try different window sizes
            for (let len = 10; len >= 1; len--) {
                if (i + len > tokens.length) continue;

                const windowTokens = tokens.slice(i, i + len);
                const windowText = windowTokens.join('');

                // Skip if window is just whitespace/punctuation
                if (!/[a-zA-Z0-9]/.test(windowText)) continue;

                // Check against answers
                const isMatch = possibleAnswers.some(ans => calculateSimilarity(windowText, ans) >= THRESHOLD);

                // Also check against prompt question text (fallback)
                const isPromptMatch = calculateSimilarity(windowText, target2) >= THRESHOLD;

                if (isMatch || isPromptMatch) {
                    // Mark all tokens in this window as masked
                    for (let k = 0; k < len; k++) {
                        maskedIndices.add(i + k);
                    }
                    // Skip the outer loop index
                    // i will be incremented by loop, so we add len - 1
                    // Actually, simpler to just let the outer loop continue and hit the "if has" check
                    break; // Found largest match for this start position
                }
            }
        }

        // If no matches found, fallback to rendering sentence as is
        if (maskedIndices.size === 0) {
            return <p className="text-xl md:text-2xl text-slate-700 italic">"{sentence}"</p>;
        }

        return (
            <p className="text-xl md:text-2xl text-slate-700 leading-relaxed italic">
                "{tokens.map((token, i) => {
                    if (maskedIndices.has(i)) {
                        // Only render one placeholder for the start of a masked group
                        if (i === 0 || !maskedIndices.has(i - 1)) {
                            return <span key={i} className="border-b-2 border-primary text-transparent px-2 select-none bg-primary/5 rounded min-w-[3rem] inline-block mx-1">____</span>;
                        }
                        return null; // Don't render subsequent masked tokens
                    }
                    return <span key={i}>{token}</span>;
                })}"
            </p>
        );
    };

    // Unified Feedback
    const feedbackTokens = feedback
        ? getVisualDiff(feedback.userAnswer, feedback.correctAnswer)
        : [];

    return (
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
            {/* Question Card */}
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden relative p-8 md:p-12 text-center">

                {/* Standard Question Display */}
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 leading-tight">
                    {question.question_text}
                </h2>

                {/* Contextual Cloze (Below Question) */}
                {enableCloze && (
                    <div className="mt-8 pt-6 border-t border-slate-100 animate-in slide-in-from-bottom-2 fade-in">
                        {question.example_sentence ? (
                            <>
                                {renderClozeSentence()}
                            </>
                        ) : (
                            <div className="text-slate-400 italic text-sm">
                                <p>"No example sentence available"</p>
                                <p className="text-[10px] mt-1 uppercase font-bold tracking-wider">Context Unavailable</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Input Area (Unified) */}
            <div className="max-w-xl mx-auto space-y-4">
                <div className="relative group">
                    {/* 
                      Switch between Input and Rich Feedback Div
                      Always show feedback div after answer to visualize typos/matches
                    */}

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
                            placeholder={hintText ? `${hintText}...` : "Type your answer..."}
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

                    {/* Enter Hint */}
                    {!disabled && input.length > 0 && !feedback && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 text-xs font-bold text-slate-300 pointer-events-none animate-in fade-in">
                            <span>Hit Enter</span>
                            <div className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center bg-slate-50">⏎</div>
                        </div>
                    )}
                </div>

                {/* Actions */}
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

export default memo(TypingQuestion);
