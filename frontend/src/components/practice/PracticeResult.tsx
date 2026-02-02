"use client";

import { PracticeSessionResult } from '@/types/practice';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, RotateCcw, Home, Target, TrendingUp, ExternalLink, Zap, SkipForward } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';
import { useAuthStore } from '@/stores/authStore';

interface PracticeResultProps {
    result: PracticeSessionResult;
    wrongAnswers: Array<{
        english: string;
        translation: string;
        id: string;
    }>;
    skippedCount?: number;
}



export default function PracticeResult({ result, wrongAnswers, skippedCount = 0 }: PracticeResultProps) {
    const { user } = useAuthStore();
    const firstName = user?.full_name?.split(' ')[0] || user?.username || 'Learner';

    // Format duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    // Calculate Avg Speed (seconds per question)
    const avgSpeed = result.total_questions > 0
        ? (result.duration_seconds / result.total_questions).toFixed(1)
        : '0';

    // Chart Data
    // Backend returns total 'wrong' inclusive of skipped.
    // If we have skippedCount explicitly, 'Actual Wrong' = Total Wrong - Skipped
    const actualWrong = Math.max(0, result.wrong_answers - skippedCount);

    // Safety check just in case skipped count is higher than wrong (shouldn't happen but visual safety)
    const validSkipped = Math.min(skippedCount, result.wrong_answers);

    const chartData = [
        { name: 'Correct', value: result.correct_answers, color: '#10b981' }, // Emerald-500
        { name: 'Wrong', value: actualWrong, color: '#ef4444' }, // Red-500
        { name: 'Skipped', value: validSkipped, color: '#f59e0b' }, // Amber-500
    ].filter(d => d.value > 0);

    // If empty (0 questions?), show grey ring
    if (chartData.length === 0) {
        chartData.push({ name: 'Empty', value: 1, color: '#e2e8f0' });
    }

    // Motivational logic
    const getMotivation = (accuracyRaw: number, wrongCount: number) => {
        const accuracy = Number(accuracyRaw);

        if (accuracy === 100) return {
            title: "Perfect Score!",
            msg: `Flawless victory, ${firstName}! Zero mistakes. You nailed it!`,
            color: "text-emerald-600"
        };

        if (accuracy >= 90) return {
            title: "Outstanding!",
            msg: `So close to perfection, ${firstName}! Just ${wrongCount} mistake${wrongCount > 1 ? 's' : ''} to learn from today.`,
            color: "text-emerald-500"
        };

        if (accuracy >= 80) return {
            title: "Great Job!",
            msg: `Solid performance, ${firstName}! You mastered most of them. Let's fix those ${wrongCount} misses.`,
            color: "text-emerald-500"
        };

        if (accuracy >= 70) return {
            title: "Good Effort!",
            msg: `Good hustle, ${firstName}! Review the ${wrongCount} words you missed and you'll shine next time.`,
            color: "text-emerald-600"
        };

        if (accuracy >= 60) return {
            title: "Not Bad!",
            msg: `You're getting there, ${firstName}. Focus on the ${wrongCount} tricky words you encountered.`,
            color: "text-amber-500"
        };

        if (accuracy >= 50) return {
            title: "Keep Going!",
            msg: `A tough session, ${firstName}, but that's how we grow. Let's tackle these ${wrongCount} misses again.`,
            color: "text-amber-600"
        };

        if (accuracy >= 30) return {
            title: "Don't Give Up!",
            msg: `Don't be discouraged, ${firstName}. Learning takes time. Review your mistakes and try again.`,
            color: "text-orange-500"
        };

        return {
            title: "Stay Strong!",
            msg: `Keep your chin up, ${firstName}! Focus on quality over speed. You've got this!`,
            color: "text-red-500"
        };
    };

    const motivation = getMotivation(result.accuracy, actualWrong);



    return (
        <div className="max-w-xl mx-auto text-center space-y-8 animate-in zoom-in-95 duration-500">
            {/* Header / Score */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                <div className="mb-6">
                    <p className="text-slate-400 font-medium uppercase tracking-wider text-sm mb-2">Session Complete</p>
                    <h1 className="text-4xl font-extrabold text-slate-800">{motivation.title}</h1>
                    <p className={`mt-2 font-bold text-lg ${motivation.color}`}>{motivation.msg}</p>
                </div>

                <div className="flex items-center justify-center gap-8 mb-8 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                                <Label
                                    value={`${Math.round(result.accuracy)}%`}
                                    position="center"
                                    className="text-3xl font-black fill-slate-800"
                                    style={{ fontSize: '2rem', fontWeight: 900 }}
                                />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-100 pt-6">
                    <div className="text-center">
                        <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Score</p>
                        <p className="text-xl font-bold text-slate-700 flex items-center justify-center gap-1">
                            <CheckCircle size={16} className="text-emerald-500" />
                            {result.correct_answers}/{result.total_questions}
                        </p>
                    </div>
                    <div className="text-center border-l-0 md:border-l border-slate-100">
                        <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Skipped</p>
                        <p className="text-xl font-bold text-slate-700 flex items-center justify-center gap-1">
                            <SkipForward size={16} className="text-slate-400" />
                            {skippedCount}
                        </p>
                    </div>
                    <div className="text-center border-l-0 md:border-l border-slate-100">
                        <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Time</p>
                        <p className="text-xl font-bold text-slate-700 flex items-center justify-center gap-1">
                            <Clock size={16} className="text-blue-500" />
                            {formatDuration(result.duration_seconds)}
                        </p>
                    </div>
                    <div className="text-center border-l border-slate-100">
                        <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Avg. Speed</p>
                        <p className="text-xl font-bold text-slate-700 flex items-center justify-center gap-1">
                            <Zap size={16} className="text-amber-500 fill-amber-500" />
                            {avgSpeed}s
                        </p>
                    </div>
                </div>
            </div>

            {/* Wrong Answers List */}
            {wrongAnswers.length > 0 && (
                <div className="bg-white rounded-2xl border border-red-100 overflow-hidden text-left">
                    <div className="p-4 bg-red-50 border-b border-red-100 flex items-center gap-2 text-red-700 font-bold">
                        <XCircle size={20} />
                        <h3>Words to Review ({wrongAnswers.length})</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {wrongAnswers.map((vocab) => (
                            <div key={vocab.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div>
                                    <p className="font-bold text-slate-800">{vocab.english}</p>
                                    <p className="text-slate-500 text-sm">{vocab.translation}</p>
                                </div>
                                <Link
                                    href={`/vocabulary/${vocab.id}`}
                                    className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                                    title="View Details"
                                >
                                    <ExternalLink size={18} />
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                    href="/practice"
                    className="px-8 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
                >
                    <Home size={20} /> Back to Home
                </Link>
                <Link
                    href="/practice/setup"
                    className="px-8 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                >
                    <RotateCcw size={20} /> Practice Again
                </Link>
            </div>
        </div>
    );
}
