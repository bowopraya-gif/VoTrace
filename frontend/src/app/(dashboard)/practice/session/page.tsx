"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query'; // Import QueryClient
import api from '@/lib/api';
import { PracticeQuestion, PracticeSessionResult, TypingQuestion as TypingQuestionType, ListeningQuestion as ListeningQuestionType, MatchingQuestion as MatchingQuestionType, MatchingResult, TypoTolerance } from '@/types/practice';
import MultipleChoiceQuestion from '@/components/practice/MultipleChoiceQuestion';
import TypingQuestion from '@/components/practice/TypingQuestion';
import ListeningQuestion from '@/components/practice/ListeningQuestion';
import { MatchingQuestion } from '@/components/practice/MatchingQuestion';
import { MatchingRoundSkeleton } from '@/components/practice/MatchingRoundSkeleton';
import QuestionFeedback from '@/components/practice/QuestionFeedback';
import PracticeResult from '@/components/practice/PracticeResult';
import { useAudioPreloader } from '@/hooks/useAudioPreloader';
import { X, Clock, Play, Loader2, Target } from 'lucide-react';
import Link from 'next/link';
import { useStreakStore } from '@/stores/streakStore';

function PracticeSessionContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const queryClient = useQueryClient(); // Initialize
    const sessionId = searchParams.get('id');

    const [loading, setLoading] = useState(true);
    // Allow all question types
    const [questions, setQuestions] = useState<(PracticeQuestion | TypingQuestionType | ListeningQuestionType | MatchingQuestionType)[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [status, setStatus] = useState<'question' | 'feedback' | 'completed'>('question');
    // Store user answer for feedback display (Typing mode needs it for coloring)
    const [feedback, setFeedback] = useState<{ isCorrect: boolean; correctAnswer: string; userAnswer: string } | null>(null);
    const [result, setResult] = useState<PracticeSessionResult | null>(null);
    const [sessionTotal, setSessionTotal] = useState(0);
    const [startTime, setStartTime] = useState<number>(Date.now());
    const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
    const [wrongAnswers, setWrongAnswers] = useState<Array<{ english: string, translation: string, id: string }>>([]);
    const [skippedCount, setSkippedCount] = useState(0);

    // Matching Mode Specific State
    const [currentRoundProgress, setCurrentRoundProgress] = useState(0);
    const [mode, setMode] = useState<string>('multiple_choice');
    const [tolerance, setTolerance] = useState<TypoTolerance>('normal');
    const [enableCloze, setEnableCloze] = useState(false);

    // Fetch questions on mount (or if we passed them via state, but API is safer for refresh)
    // Actually, start endpoint returns questions. But if user refreshes, we lose state unless persisted.
    // For MVP: If refresh, redirect to setup or restart.
    // Let's assume we call a "get session details" endpoint or just reuse start response if we could.
    // Since we redirected here after start, we might not have questions if we didn't pass them.
    // We need an endpoint to "resume" or "get questions for session".
    // Alternatively, `start` could be called HERE on mount using logic from setup?
    // Correct approach: `Setup` calls `start`, gets ID + questions, passes them via state/context OR 
    // redirects to valid URL. 
    // Simplified MVP: Pass questions via localStorage or re-fetch.
    // Let's implement a 'get questions' endpoint or just pass them via window object/store? 
    // No, cleaner is to have `Setup` just be the UI, and THIS page calls `start`.
    // BUT `Setup` has the form.
    // Let's handle it by: `Setup` creates session -> redirects with ID. This page fetches session status/questions?
    // We added `GET /practice/questions` to plan but didn't implement it in controller yet.
    // Workaround: We will use localStorage to pass questions from Setup to Session to avoid network roundtrip/new endpoint for now, 
    // matching the "Start" flow.
    // Actually, let's just make the `start` call happen here? No, setup has params.

    // Let's use `window.history.state` or similar. Next.js router state is tricky.
    // Let's assume the user lands here with an ID. If we don't have questions, maybe we can fetch them?
    // Let's update Setup to store questions in sessionStorage or similar. 
    // Better yet: Add `GET /practice/session/{id}` to backend? 
    // For speed now: I will modify `Setup` to store the start response in `sessionStorage` and read it here.

    // Session Guard & Persistence
    useEffect(() => {
        if (sessionId) {
            // Mark session as active for global guard
            sessionStorage.setItem('active_practice_id', sessionId);

            // Block Start
            const handleBeforeUnload = (e: BeforeUnloadEvent) => {
                e.preventDefault();
                e.returnValue = '';
            };
            window.addEventListener('beforeunload', handleBeforeUnload);

            // Push state to trap back button (soft block)
            window.history.pushState(null, '', window.location.href);
            const handlePopState = () => {
                window.history.pushState(null, '', window.location.href);
                // Optional: alert("Please use the Quit button to leave."); 
            };
            window.addEventListener('popstate', handlePopState);

            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
                window.removeEventListener('popstate', handlePopState);
            };
        }
    }, [sessionId]);

    useEffect(() => {
        const storedData = sessionStorage.getItem(`practice_session_${sessionId}`);
        if (storedData) {
            const data = JSON.parse(storedData);
            setQuestions(data.questions);
            setSessionTotal(data.total);
            setMode(data.mode || 'multiple_choice');

            // Extract settings if available (will be saved by Setup)
            if (data.settings) {
                setTolerance(data.settings.tolerance || 'normal');
                setEnableCloze(data.settings.enableCloze || false);
            }

            setLoading(false);
            setQuestionStartTime(Date.now());
            setStartTime(Date.now());
        } else {
            // If no data found (direct access), redirect to setup
            if (sessionId) {
                // Ideally fetch from API, but for MVP just redirect
                // alert("Session expired or not found. Please start a new session.");
                router.push('/practice');
            }
        }
    }, [sessionId, router]);

    const handleQuit = useCallback(() => {
        if (confirm("Are you sure you want to quit? Your progress will be lost.")) {
            sessionStorage.removeItem('active_practice_id');
            router.push('/practice');
        }
    }, [router]);

    // Flexible handler for both MC and Typing
    const handleAnswer = useCallback(async (
        answer: string,
        isCorrectOverride?: boolean,
        correctAnswerOverride?: string,
        hintCount: number = 0
    ) => {
        const currentQuestion = questions[currentIndex];
        const timeSpent = Date.now() - questionStartTime;

        let isCorrect = false;
        let correctAnswer = '';

        if (mode === 'typing' || mode === 'listening') {
            // Typing/Listening mode passes results directly
            isCorrect = !!isCorrectOverride;
            correctAnswer = correctAnswerOverride || '';
        } else {
            // MC mode logic
            const q = currentQuestion as PracticeQuestion;
            correctAnswer = q.options[q.correct_index];
            isCorrect = answer === correctAnswer;
        }

        // CRITICAL FIX: Reset timer BEFORE changing status to prevent the useEffect from seeing '0'
        setAutoAdvanceSeconds(5);
        setStatus('feedback');
        setFeedback({ isCorrect, correctAnswer, userAnswer: answer });

        // Submit to backend in background
        try {
            // Matching mode uses handleMatchingComplete, so we shouldn't be here or we handle it differently
            if (mode === 'matching') return;

            const standardQuestion = currentQuestion as Exclude<typeof currentQuestion, MatchingQuestionType>;

            await api.post('/practice/answer', {
                session_id: sessionId,
                vocabulary_id: standardQuestion.vocabulary_id,
                question_type: mode,
                user_answer: answer,
                correct_answer: correctAnswer,
                is_correct: isCorrect,
                time_spent_ms: timeSpent,
                hint_count: hintCount
            });

            // Track wrong answer for review
            if (!isCorrect) {
                setWrongAnswers(prev => [...prev, {
                    english: (currentQuestion as Exclude<typeof currentQuestion, MatchingQuestionType>).question_text, // Context dependent
                    translation: correctAnswer,
                    id: (currentQuestion as Exclude<typeof currentQuestion, MatchingQuestionType>).vocabulary_id
                }]);
            }

            // OPTIMIZATION: If this was the last question, start processing completion NOW
            // This ensures results are ready when the 5s timer ends
            if (currentIndex === questions.length - 1) {
                const duration = Math.floor((Date.now() - startTime) / 1000);
                completionPromiseRef.current = api.post('/practice/complete', {
                    session_id: sessionId,
                    duration_seconds: duration
                }).then(async (res) => {
                    // Pre-fetch streak status so it's ready
                    await useStreakStore.getState().fetchStatus();
                    return res;
                });
            }

        } catch (error) {
            console.error("Failed to submit answer", error);
        }
    }, [questions, currentIndex, mode, questionStartTime, sessionId, startTime]);



    // Processing guard
    const processingRef = useRef(false);
    // Eager completion promise ref
    const completionPromiseRef = useRef<Promise<any> | null>(null);

    const finishSession = useCallback(async () => {
        if (processingRef.current) return;
        processingRef.current = true;
        setLoading(true);

        try {
            // Check if we already started completion in background
            if (completionPromiseRef.current) {
                await completionPromiseRef.current;
            } else {
                // Fallback normal completion
                const duration = Math.floor((Date.now() - startTime) / 1000);
                await api.post('/practice/complete', {
                    session_id: sessionId,
                    duration_seconds: duration
                });

                // Update streak
                useStreakStore.getState().fetchStatus();

                // Invalidate queries to update Recent Activity on dashboards
                queryClient.invalidateQueries({ queryKey: ['practice'] });
                queryClient.invalidateQueries({ queryKey: ['learning'] });
            }

            // Clear session guard before redirecting
            sessionStorage.removeItem('active_practice_id');

            // Redirect to dedicated result page
            router.push(`/practice/result?id=${sessionId}&skipped=${skippedCount}`);

        } catch (error) {
            console.error("Failed to complete session", error);
            alert("Failed to save session results. Please try again or check your connection.");
            processingRef.current = false;
            setLoading(false);
        }
    }, [sessionId, startTime, router, skippedCount]);

    const handleNext = useCallback(async () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setCurrentRoundProgress(0); // Reset for next round
            setStatus('question');
            setFeedback(null);
            setQuestionStartTime(Date.now());
            // Reset for safety, though it will be set again on answer
            setAutoAdvanceSeconds(5);
        } else {
            // Complete Session
            finishSession();
        }
    }, [currentIndex, questions.length, finishSession]);

    // Matching Mode Handler (Batched) - Moved here to avoid circular dependency with finishSession
    const handleMatchingComplete = useCallback(async (results: MatchingResult[], totalTimeMs: number) => {
        try {
            await api.post('/practice/answer-batch', {
                session_id: sessionId,
                results: results
            });

            // Advance logic
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setCurrentRoundProgress(0);
            } else {
                finishSession();
            }

        } catch (err) {
            console.error("Failed to submit matching batch", err);
        }

    }, [questions.length, currentIndex, sessionId, finishSession]);

    // Processing guard
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Auto-advance timer (5 seconds)
    const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState(5);

    // Timer Effect
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (status === 'feedback') {
            // Remove redundancy: State is already set in handleAnswer
            // But for safety against weird mounts, we can ensure it's not 0 if we just entered
            // However, resetting here causes a double-render or race if not careful.
            // Trust handleAnswer.

            timer = setInterval(() => {
                setAutoAdvanceSeconds(prev => Math.max(0, prev - 1));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [status]);

    // Handle Timeout Effect
    useEffect(() => {
        // Only advance if we are actually in feedback mode and timer hit 0
        if (status === 'feedback' && autoAdvanceSeconds === 0) {
            handleNext();
        }
    }, [autoAdvanceSeconds, status]);

    const sessionSeconds = Math.floor((now - startTime) / 1000);
    const questionSeconds = Math.floor((now - questionStartTime) / 1000);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const formatStartTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    };



    // Skip Handler
    const handleSkip = useCallback(() => {
        setSkippedCount(prev => prev + 1);
        const currentQuestion = questions[currentIndex];

        let correctAnswer = '';
        if (mode === 'typing' || mode === 'listening') {
            correctAnswer = (currentQuestion as TypingQuestionType | ListeningQuestionType).correct_answer;
        } else {
            const q = currentQuestion as PracticeQuestion;
            correctAnswer = q.options[q.correct_index];
        }

        const timeSpent = Date.now() - questionStartTime;

        // CRITICAL FIX: Reset timer BEFORE changing status
        setAutoAdvanceSeconds(5);
        setStatus('feedback');
        setFeedback({ isCorrect: false, correctAnswer, userAnswer: '' });

        // Submit as wrong answer (skipped)
        // We can add a specific flag 'skipped' to backend if needed, for now treat as wrong
        const standardQuestion = currentQuestion as PracticeQuestion | TypingQuestionType | ListeningQuestionType;

        // If matching, we might need to skip ALL items or just handle differently. 
        // For now preventing crash by casting, assuming skip button might be hidden or generic.
        // Actually usually Matching mode doesn't have a simple "Skip" button for the whole round in the same way.
        const vocabId = mode === 'matching' ? (currentQuestion as MatchingQuestionType).vocabulary_ids[0] : standardQuestion.vocabulary_id;
        const qText = mode === 'matching' ? 'Matching Round' : standardQuestion.question_text;

        api.post('/practice/answer', {
            session_id: sessionId,
            vocabulary_id: vocabId,
            question_type: mode,
            user_answer: 'skipped', // or null?
            correct_answer: correctAnswer,
            is_correct: false,
            time_spent_ms: timeSpent
        }).catch(err => console.error("Failed to skip", err));

        setWrongAnswers(prev => [...prev, {
            english: qText,
            translation: correctAnswer,
            id: vocabId
        }]);
    }, [questions, currentIndex, mode, questionStartTime, sessionId]);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

    if (!loading && questions.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500">
                    <X size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No Questions Available</h3>
                <p className="text-slate-500 mb-8">Unable to load practice questions for this session.</p>
                <Link
                    href="/practice"
                    className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
                >
                    Return to Practice
                </Link>
            </div>
        );
    }

    if (status === 'completed' && result) {
        return <PracticeResult result={result} wrongAnswers={wrongAnswers} skippedCount={skippedCount} mode={mode} />;
    }

    const currentQuestion = questions[currentIndex];

    // Guard against undefined question (e.g. index out of bounds)
    if (!currentQuestion) {
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className={`mx-auto min-h-[80vh] flex flex-col py-8 px-4 ${mode === 'matching' ? 'max-w-7xl' : 'max-w-4xl'}`}>
            {/* Header Card */}
            <div className="bg-white rounded-[1.5rem] shadow-lg border border-slate-100 p-6 mb-8 max-w-4xl mx-auto w-full">

                {/* Top Row: Timers & Stats (Standard Mode Only) */}
                {mode !== 'matching' && (
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                        {/* Timers & Quit */}
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <button
                                onClick={handleQuit}
                                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Quit Session"
                            >
                                <X size={24} />
                            </button>

                            <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-2 border border-slate-100">
                                <div className="flex items-center gap-2 px-3 py-1 border-r border-slate-200">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">Question</span>
                                        <span className="font-mono font-bold text-slate-700">{formatTime(questionSeconds)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">Session</span>
                                        <span className="font-mono font-bold text-slate-700">{formatTime(sessionSeconds)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Simple Stats */}
                        <div className="flex items-center gap-2">
                            {(currentQuestion as PracticeQuestion).part_of_speech && (
                                <div className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200">
                                    {(currentQuestion as PracticeQuestion).part_of_speech}
                                </div>
                            )}

                            <div className={`
                                    px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border
                                    ${(currentQuestion as PracticeQuestion).learning_status === 'learning' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                    ${(currentQuestion as PracticeQuestion).learning_status === 'review' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                                    ${(currentQuestion as PracticeQuestion).learning_status === 'mastered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                                    ${!(currentQuestion as PracticeQuestion).learning_status ? 'bg-slate-50 text-slate-600 border-slate-100' : ''}
                            `}>
                                Status: {(currentQuestion as PracticeQuestion).learning_status || 'Unknown'}
                            </div>
                        </div>
                    </div>
                )}

                {/* Middle Row: Info (Centered) */}
                {/* Middle Row: Info (Centered) */}
                <div className="flex justify-center items-center gap-12 text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-y border-slate-50 py-4 relative">

                    {/* Quit Button (Matching Mode Only) - Absolute Left or Inline */}
                    {mode === 'matching' && (
                        <button
                            onClick={handleQuit}
                            className="absolute -left-3 p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Quit Session"
                        >
                            <X size={24} />
                        </button>
                    )}

                    <div className="text-center">
                        <div className="text-[10px] text-slate-300 mb-1">STARTED</div>
                        <div className="text-slate-500 font-mono text-sm">
                            {formatStartTime(startTime)}
                        </div>
                    </div>
                    <div className="w-px h-8 bg-slate-100" />
                    <div className="text-center">
                        <div className="text-[10px] text-slate-300 mb-1">{mode === 'matching' ? 'SESSION TIME' : 'SPEED'}</div>
                        <div className="text-slate-500 font-mono text-sm">
                            {mode === 'matching'
                                ? formatTime(sessionSeconds)
                                : `${currentIndex > 0 ? Math.round(((questionStartTime - startTime) / 1000) / currentIndex) : 0}s/question`
                            }
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Progress */}
                {(() => {
                    // Progress Calculation Logic
                    let progressPercent = 0;
                    let progressText = '';
                    let progressSubText = '';

                    if (mode === 'matching') {
                        // Matching Mode: Calculate Total Pairs
                        // Sum of pair_count for ALL questions
                        const totalPairs = questions.reduce((acc, q) => acc + ((q as MatchingQuestionType).pair_count || 0), 0);

                        // Sum of pair_count for COMPLETED rounds (previous indices)
                        const pastPairs = questions.slice(0, currentIndex).reduce((acc, q) => acc + ((q as MatchingQuestionType).pair_count || 0), 0);

                        // Current Total
                        const currentTotalProgress = pastPairs + currentRoundProgress;

                        progressPercent = totalPairs > 0 ? (currentTotalProgress / totalPairs) * 100 : 0;
                        progressText = `Pairs ${currentTotalProgress} / ${totalPairs}`;
                        progressSubText = `Progress: ${Math.round(progressPercent)}%`;
                    } else {
                        // Standard Mode
                        progressPercent = (currentIndex + 1) / sessionTotal * 100;
                        progressText = `Question ${currentIndex + 1}`;
                        progressSubText = `Progress: ${currentIndex + 1}/${sessionTotal} (${Math.round(progressPercent)}%)`;
                    }

                    return (
                        <div className="space-y-2">
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden relative">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center mt-2 px-1">
                                <span className="text-xs font-bold text-slate-300">Start</span>
                                <div className="text-center">
                                    <div className="text-sm font-bold text-primary">{progressText}</div>
                                    <div className="text-xs font-medium text-slate-400">
                                        {progressSubText}
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-slate-300">Finish</span>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Question Area */}
            <div className="flex-1 flex flex-col mb-20">
                {mode === 'typing' ? (
                    <TypingQuestion
                        question={currentQuestion as TypingQuestionType}
                        onAnswer={handleAnswer}
                        onSkip={handleSkip}
                        disabled={status === 'feedback'}
                        feedback={feedback}
                        tolerance={tolerance}
                        enableCloze={enableCloze}
                    />
                ) : mode === 'listening' ? (
                    <ListeningQuestion
                        question={currentQuestion as ListeningQuestionType}
                        onAnswer={handleAnswer}
                        onSkip={handleSkip}
                        disabled={status === 'feedback'}
                        feedback={feedback}
                        tolerance={tolerance}
                    />
                ) : mode === 'matching' ? (
                    <MatchingQuestion
                        key={(currentQuestion as MatchingQuestionType).id} // Force re-mount to reset state
                        question={currentQuestion as MatchingQuestionType}
                        onComplete={handleMatchingComplete}
                        onProgress={setCurrentRoundProgress}
                        disabled={false}
                    />
                ) : (
                    <MultipleChoiceQuestion
                        question={currentQuestion as PracticeQuestion}
                        onAnswer={(ans) => handleAnswer(ans)}
                        onSkip={handleSkip}
                        disabled={status === 'feedback'}
                        feedback={feedback ? {
                            isCorrect: feedback.isCorrect,
                            correctAnswer: feedback.correctAnswer
                        } : null}
                    />
                )}
            </div>

            {/* Feedback Footer / Overlay */}
            {status === 'feedback' && feedback && (
                <QuestionFeedback
                    isCorrect={feedback.isCorrect}
                    correctAnswer={feedback.correctAnswer}
                    onNext={handleNext}
                    secondsRemaining={autoAdvanceSeconds}
                />
            )}
        </div>
    );
}

export default function PracticeSessionPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-primary h-12 w-12" />
            </div>
        }>
            <PracticeSessionContent />
        </Suspense>
    );
}
