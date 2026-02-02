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

        // Split sentence into tokens while preserving separators
        // Regex splits by word boundaries but keeps delimiters
        const tokens = sentence.split(/(\b|\W+)/);

        // Target words to match (Correct Answer OR Question Text)
        const target1 = question.correct_answer;
        const target2 = question.question_text; // Fallback if 1st not found

        // We want to find the token that best matches our targets
        // Threshold for fuzzy match (0.6 allows for "decision" matching "decisions")
        const THRESHOLD = 0.6;

        let hasMasked = false;

        const maskedTokens = tokens.map((token, i) => {
            // Skip non-word tokens
            if (!/\w+/.test(token)) return token;

            // Check similarity
            const sim1 = calculateSimilarity(token, target1);
            const sim2 = calculateSimilarity(token, target2);

            // Prioritize matching correct_answer (what we type)
            if (sim1 >= THRESHOLD) {
                hasMasked = true;
                return <span key={i} className="border-b-2 border-primary text-transparent px-2 select-none bg-primary/3 rounded min-w-[3rem] inline-block mx-1">____</span>;
            }

            // If answer not found, check prompt (sim2) BUT only if we haven't masked anything yet?
            // Actually, we want to mask the conceptually similar word.
            // If we find the prompt word, we mask it too?
            // User requirement: "Cari kata ... dan ganti dengan input box"
            // Usually we only mask ONE word (the gap).
            // Let's stick to masking priority 1 first. If no priority 1 found in WHOLE sentence, then try priority 2?
            // Current map approach is greedy per token.

            return token;
        });

        // If simple map didn't mask anything (maybe because we want global best match?), try again with fallback target
        // Or refined logic: Find BEST matching token index first.

        if (!hasMasked) {
            const bestMatch = tokens.reduce((best, token, idx) => {
                if (!/\w+/.test(token)) return best;
                const sim1 = calculateSimilarity(token, target1);
                const sim2 = calculateSimilarity(token, target2);
                const maxSim = Math.max(sim1, sim2);

                if (maxSim > best.score && maxSim >= THRESHOLD) {
                    return { index: idx, score: maxSim };
                }
                return best;
            }, { index: -1, score: 0 });

            if (bestMatch.index !== -1) {
                return (
                    <p className="text-xl md:text-2xl text-slate-700 leading-relaxed italic">
                        "{tokens.map((token, i) =>
                            i === bestMatch.index
                                ? <span key={i} className="border-b-2 border-primary text-transparent px-2 select-none bg-primary/5 rounded min-w-[3rem] inline-block mx-1">____</span>
                                : token
                        )}"
                    </p>
                );
            }
        } else {
            // Render the greedy masked version
            return (
                <p className="text-xl md:text-2xl text-slate-700 leading-relaxed italic">
                    "{maskedTokens}"
                </p>
            );
        }

        // Fallback
        return <p className="text-xl md:text-2xl text-slate-700 italic">"{sentence}"</p>;
    };

    // Unified Feedback
    const feedbackTokens = feedback && !feedback.isCorrect
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
                      If feedback exists (wrong answer), hide input and show feedback div that looks exactly like input.
                    */}

                    {feedback && !feedback.isCorrect ? (
                        <div className={cn(
                            "w-full text-center text-2xl md:text-3xl font-bold p-6 rounded-2xl border-2 transition-all outline-none flex items-center justify-center gap-[1px] font-mono",
                            "bg-red-50 border-red-500 text-red-700"
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
                                feedback?.isCorrect && "border-emerald-500 bg-emerald-50 text-emerald-700",
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
