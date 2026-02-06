"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PracticeMode, PracticeDirection, PRACTICE_MODES } from '@/types/practice';
import { ArrowLeft, ArrowRight, Play, AlertCircle, Settings2, ChevronDown, ChevronUp, Filter, Calendar, Hash, Check, BookOpen, ChevronRight, BarChart3, Clock, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface FilterOptions {
    parts_of_speech: string[];
    status_counts?: {
        learning: number;
        review: number;
        mastered: number;
    };
}

export default function PracticeSetup() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialMode = (searchParams.get('mode') as PracticeMode) || 'multiple_choice';

    // Wizard State
    // If mode is listening, skip Step 1 (Direction) because it's always Listen English -> Type English
    const [step, setStep] = useState(initialMode === 'listening' ? 2 : 1);

    const [mode, setMode] = useState<PracticeMode>(initialMode);

    // User Requirement: Default direction for Typing is ID->EN ("Translate to English")
    // For MC, default is EN->ID
    const [direction, setDirection] = useState<PracticeDirection>(initialMode === 'typing' ? 'id_to_en' : 'en_to_id');
    const [questionCount, setQuestionCount] = useState<number>(10);
    const [loading, setLoading] = useState(false);

    // Typing Config
    const [tolerance, setTolerance] = useState('normal');
    const [enableCloze, setEnableCloze] = useState(false);

    // Data state
    const [availableCount, setAvailableCount] = useState<number | null>(null);
    const [fetchingCount, setFetchingCount] = useState(true);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [smartSelection, setSmartSelection] = useState(true);

    // Filters state
    const [filters, setFilters] = useState({
        learning_status: ['learning', 'review'],
        part_of_speech: [] as string[],
        last_practiced: [] as string[],
        time_added: [] as string[],
        exclude_mastered: false
    });

    const { data: filterOptions = { parts_of_speech: [] } } = useQuery({
        queryKey: ['practice', 'options'],
        queryFn: () => api.get('/practice/options').then(res => res.data),
        staleTime: 0, // Always fetch fresh to ensure counts match DB
    });

    const fetchCount = useCallback(async () => {
        setFetchingCount(true);
        try {
            const res = await api.post('/practice/count', { filters });
            setAvailableCount(res.data.count);

            if (res.data.count < questionCount) {
                setQuestionCount(Math.max(1, res.data.count));
            }
        } catch (error) {
            console.error("Failed to fetch available count", error);
        } finally {
            setFetchingCount(false);
        }
    }, [filters, questionCount]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCount();
        }, 300);
        return () => clearTimeout(timer);
    }, [filters]);

    const handleStart = async () => {
        setLoading(true);
        try {
            const res = await api.post('/practice/start', {
                mode,
                direction,
                question_count: questionCount,
                filters,
                smart_selection: smartSelection
            });

            // Persist session + local settings that backend doesn't store
            sessionStorage.setItem(`practice_session_${res.data.session_id}`, JSON.stringify({
                ...res.data,
                mode, // Ensure mode is saved
                settings: {
                    tolerance,
                    enableCloze
                }
            }));

            router.push(`/practice/session?id=${res.data.session_id}`);
        } catch (error) {
            console.error("Failed to start session", error);
            alert("Failed to start session. " + ((error as any).response?.data?.message || "Error occurred."));
            setLoading(false);
        }
    };

    const toggleFilter = (type: keyof typeof filters, value: string) => {
        setFilters(prev => {
            const current = prev[type] as string[];
            const updated = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [type]: updated };
        });
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 4));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const modeInfo = PRACTICE_MODES.find(m => m.mode === mode) || PRACTICE_MODES[0];
    const maxQuestions = availableCount || 0;
    const isReady = availableCount !== null && availableCount > 0;

    // Helper for Status Card
    const StatusCard = ({ status, label, desc }: { status: string, label: string, desc: string }) => {
        const isSelected = filters.learning_status.includes(status);
        const count = filterOptions.status_counts ? (filterOptions.status_counts as any)[status] : 0;

        return (
            <button
                onClick={() => toggleFilter('learning_status', status)}
                className={`
                    relative p-8 rounded-[2rem] border-2 text-center transition-all duration-300 group flex flex-col items-center justify-center gap-4 w-full h-full
                    ${isSelected
                        ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
                        : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'}
                `}
            >
                <div className="flex flex-col items-center">
                    <h3 className={`text-xl font-bold mb-1 capitalize ${isSelected ? 'text-primary' : 'text-slate-800'}`}>{label}</h3>
                    <p className="text-sm text-slate-500 mb-4">{desc}</p>

                    <div className={`
                        px-4 py-1.5 rounded-lg text-xs font-bold
                         ${isSelected ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}
                    `}>
                        {count} words
                    </div>
                </div>

                {isSelected && (
                    <div className="absolute top-6 right-6 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center animate-in zoom-in">
                        <Check size={14} strokeWidth={3} />
                    </div>
                )}
            </button>
        );
    };

    const isListening = mode === 'listening';
    const totalSteps = isListening ? 3 : 4;
    const displayStep = isListening ? step - 1 : step;

    return (
        <div className="max-w-3xl mx-auto pb-20 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Progress */}
            <div className="mb-8 pt-4">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={(isListening ? step === 2 : step === 1) ? () => router.push('/practice') : prevStep}
                        className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="text-sm font-bold text-slate-400">
                        Step <span className="text-primary">{displayStep}</span> of {totalSteps}
                    </div>
                </div>

                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${(displayStep / totalSteps) * 100}%` }}
                    />
                </div>

                <div className="mt-4">
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                        {step === 1 && "Choose Direction"}
                        {step === 2 && "Filter Vocabulary"}
                        {step === 3 && "Number of Questions"}
                        {step === 4 && "Ready to Start?"}
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {step === 1 && "Select how you want to practice"}
                        {step === 2 && "Select which words you want to focus on"}
                        {step === 3 && "How many words do you want to practice?"}
                        {step === 4 && "Review your session settings"}
                    </p>
                </div>
            </div>

            {/* Step Content */}
            <div className="min-h-[300px]">

                {/* STEP 1: DIRECTION */}
                {step === 1 && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                        {/* Direction Selection */}
                        <div>
                            <h3 className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Select Direction</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => setDirection('en_to_id')}
                                    className={`
                                        relative p-6 rounded-[2rem] border-2 text-center transition-all duration-300 group flex items-center gap-4
                                        ${direction === 'en_to_id'
                                            ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
                                            : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'}
                                    `}
                                >
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">EN</div>
                                    <ArrowRight className="text-slate-300" size={20} />
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xl">ID</div>

                                    <div className="text-left flex-1 ml-2">
                                        <h3 className={`font-bold ${direction === 'en_to_id' ? 'text-primary' : 'text-slate-800'}`}>Translate to Indonesian</h3>
                                        <p className="text-xs text-slate-400"></p>
                                    </div>

                                    {direction === 'en_to_id' && <Check size={20} className="text-primary" />}
                                </button>

                                <button
                                    onClick={() => setDirection('id_to_en')}
                                    className={`
                                        relative p-6 rounded-[2rem] border-2 text-center transition-all duration-300 group flex items-center gap-4
                                        ${direction === 'id_to_en'
                                            ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
                                            : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'}
                                    `}
                                >
                                    <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold text-xl">ID</div>
                                    <ArrowRight className="text-slate-300" size={20} />
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xl">EN</div>

                                    <div className="text-left flex-1 ml-2">
                                        <h3 className={`font-bold ${direction === 'id_to_en' ? 'text-primary' : 'text-slate-800'}`}>Translate to English</h3>
                                    </div>

                                    {direction === 'id_to_en' && <Check size={20} className="text-primary" />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: FILTERS */}
                {step === 2 && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">

                        {/* Status Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <StatusCard
                                status="learning"
                                label="Learning"
                                desc="Words you're currently learning"
                            />
                            <StatusCard
                                status="review"
                                label="Review"
                                desc="Words scheduled for review"
                            />
                            <StatusCard
                                status="mastered"
                                label="Mastered"
                                desc="Words you've mastered"
                            />
                        </div>

                        {/* Available Count Indicator */}
                        <div className="flex items-center justify-center gap-2 py-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className={`w-2 h-2 rounded-full ${availableCount && availableCount > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className="text-sm font-bold text-slate-600">
                                {fetchingCount ? 'Updating...' : `${availableCount} words selected`}
                            </span>
                        </div>

                        {/* Advanced Filters Accordion */}
                        <div className="border-t border-slate-100 pt-6">
                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="flex items-center justify-center w-full p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group mb-6"
                            >
                                <div className="flex items-center gap-3">
                                    <Filter size={18} className="text-slate-400 group-hover:text-primary transition-colors" />
                                    <span className="font-bold text-slate-700">Advanced Filters</span>
                                    {showAdvanced ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                                </div>
                            </button>

                            {showAdvanced && (
                                <div className="space-y-8 animate-in slide-in-from-top-2 fade-in text-center">

                                    {/* Typing Specific Settings */}
                                    {mode === 'typing' && (
                                        <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20 text-left">
                                            <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                                                <div className="p-1 bg-primary/10 rounded text-primary"><Settings2 size={14} /></div>
                                                Typing Settings
                                            </h4>

                                            <div className="space-y-6">
                                                {/* Tolerance */}
                                                <div>
                                                    <label className="text-xs font-bold text-primary uppercase tracking-wider mb-2 block">Typo Tolerance</label>
                                                    <div className="flex gap-2">
                                                        {['strict', 'normal', 'lenient'].map((t) => (
                                                            <button
                                                                key={t}
                                                                onClick={() => setTolerance(t as any)} // Assuming state setTolerance matches type
                                                                className={`
                                                                    flex-1 py-2 px-3 rounded-lg text-xs font-bold capitalize transition-all
                                                                    ${tolerance === t
                                                                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                                        : 'bg-white text-primary border border-primary/20 hover:border-primary/40'}
                                                                `}
                                                            >
                                                                {t}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Cloze Toggle */}
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-bold text-slate-800 text-sm">Contextual Cloze</div>
                                                        <div className="text-xs text-slate-500">Show example sentence with blank</div>
                                                    </div>
                                                    <button
                                                        onClick={() => setEnableCloze(!enableCloze)}
                                                        className={`
                                                            w-12 h-6 rounded-full transition-colors relative
                                                            ${enableCloze ? 'bg-primary' : 'bg-slate-300'}
                                                        `}
                                                    >
                                                        <div className={`
                                                            absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
                                                            ${enableCloze ? 'translate-x-6' : 'translate-x-0'}
                                                        `} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Part of Speech */}
                                    {filterOptions.parts_of_speech.length > 0 && (
                                        <div className="group/section relative z-30">
                                            <div className="flex items-center justify-center gap-2 mb-3">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Part of Speech</label>
                                            </div>
                                            <div className="flex flex-wrap justify-center gap-2">
                                                {filterOptions.parts_of_speech.map((pos: string) => (
                                                    <div key={pos} className="relative group/btn">
                                                        <button
                                                            onClick={() => toggleFilter('part_of_speech', pos)}
                                                            className={`
                                                                px-4 py-2 text-xs font-bold rounded-lg border transition-all active:scale-95
                                                                ${filters.part_of_speech.includes(pos)
                                                                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                                                    : 'bg-white text-slate-500 border-slate-200 hover:border-primary/30 hover:text-primary'}
                                                            `}
                                                        >
                                                            {pos}
                                                        </button>
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all whitespace-nowrap pointer-events-none z-50 shadow-lg">
                                                            Filter by {pos}
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Last Practiced */}
                                    <div className="group/section relative z-20">
                                        <div className="flex items-center justify-center gap-2 mb-3">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Practiced</label>
                                        </div>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {[
                                                { val: 'not_practiced', label: 'Not Yet', desc: 'Words you have never practiced' },
                                                { val: 'today', label: 'Today', desc: 'Already practiced today' },
                                                { val: 'this_week', label: 'This Week', desc: 'Practiced within the last 7 days' },
                                                { val: 'long_ago', label: 'Long Ago', desc: 'Not practiced in 30+ days' },
                                                { val: 'overdue', label: '🔥 Overdue', desc: 'Due for review according to SRS' }
                                            ].map(opt => (
                                                <div key={opt.val} className="relative group/btn">
                                                    <button
                                                        onClick={() => toggleFilter('last_practiced', opt.val)}
                                                        className={`
                                                             px-4 py-2 text-xs font-bold rounded-lg border transition-all active:scale-95
                                                            ${filters.last_practiced.includes(opt.val)
                                                                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                                                : 'bg-white text-slate-500 border-slate-200 hover:border-primary/30 hover:text-primary'}
                                                        `}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all whitespace-nowrap pointer-events-none z-50 shadow-lg">
                                                        {opt.desc}
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                    </div>
                                                </div>
                                            ))
                                            }
                                        </div>
                                    </div>

                                    {/* Time Added */}
                                    <div className="relative z-10">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Added Date</label>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {[
                                                { val: 'today', label: 'Today', desc: 'Words added today' },
                                                { val: 'this_week', label: 'This Week', desc: 'Words added this week' },
                                                { val: 'this_month', label: 'This Month', desc: 'Words added this month' }
                                            ].map(opt => (
                                                <div key={opt.val} className="relative group/btn">
                                                    <button
                                                        onClick={() => toggleFilter('time_added', opt.val)}
                                                        className={`
                                                             px-4 py-2 text-xs font-bold rounded-lg border transition-all active:scale-95
                                                            ${filters.time_added.includes(opt.val)
                                                                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                                                : 'bg-white text-slate-500 border-slate-200 hover:border-primary/30 hover:text-primary'}
                                                        `}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all whitespace-nowrap pointer-events-none z-50 shadow-lg">
                                                        {opt.desc}
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 3: QUESTIONS */}
                {step === 3 && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                        {availableCount === 0 ? (
                            <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                    <AlertCircle size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 mb-2">No Words Available</h3>
                                <p className="text-slate-500 mb-6 max-w-xs mx-auto">None of your vocabulary matches the filters you selected in the previous step.</p>
                                <button
                                    onClick={prevStep}
                                    className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
                                >
                                    Go Back & Change Filters
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                                <div className="text-center mb-10">
                                    <div className="inline-block relative">
                                        <input
                                            type="number"
                                            min="1"
                                            max={maxQuestions}
                                            value={questionCount}
                                            onChange={(e) => setQuestionCount(Number(e.target.value))}
                                            className="w-40 text-center font-black text-6xl text-primary bg-transparent outline-none p-0 border-none"
                                        />
                                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mt-2">Questions</div>
                                    </div>
                                </div>

                                <div className="px-4 mb-4">
                                    <input
                                        type="range"
                                        min="1"
                                        max={maxQuestions}
                                        value={questionCount}
                                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                                        className="w-full h-4 bg-slate-100 rounded-full appearance-none cursor-pointer accent-primary hover:accent-primary/90 transition-all"
                                    />
                                    <div className="flex justify-between mt-4 text-xs font-bold text-slate-400">
                                        <span>1</span>
                                        <span>{maxQuestions} Available</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 4: SUMMARY */}
                {step === 4 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                        <div className="bg-white text-slate-800 p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden">

                            <h2 className="text-2xl font-bold mb-8 text-slate-900 text-center relative z-10">Session Summary</h2>
                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                                <div>
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                                                <Settings2 size={20} />
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-0.5">Mode</div>
                                                <div className="font-bold text-lg">{modeInfo.label}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                                                <RotateCcw size={20} />
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-0.5">Direction</div>
                                                <div className="font-bold text-lg">{direction === 'en_to_id' ? 'EN → ID' : 'ID → EN'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Filters Summary */}
                                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                                        <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-3">Active Filters</div>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {filters.learning_status.map(s => (
                                                <span key={s} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg capitalize">
                                                    {s}
                                                </span>
                                            ))}
                                            {filters.part_of_speech.map(p => (
                                                <span key={p} className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg capitalize">
                                                    {p}
                                                </span>
                                            ))}
                                            {filters.last_practiced.map(l => (
                                                <span key={l} className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg capitalize">
                                                    {l.replace('_', ' ')}
                                                </span>
                                            ))}
                                            {filters.time_added.map(t => (
                                                <span key={t} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg capitalize">
                                                    Added {t.replace('_', ' ')}
                                                </span>
                                            ))}

                                            {/* Smart Selection Badge */}
                                            {smartSelection && (
                                                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg flex items-center gap-1">
                                                    🧠 Smart SRS
                                                </span>
                                            )}

                                            {filters.part_of_speech.length === 0 && filters.last_practiced.length === 0 && filters.time_added.length === 0 && !smartSelection && (
                                                <span className="text-slate-400 text-xs italic">No advanced filters</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-12 items-center text-center">
                                    <div>
                                        <div className="text-sm text-slate-400 font-bold mb-2">Total Questions</div>
                                        <div className="text-6xl font-black text-primary mb-4">{questionCount}</div>
                                        <p className="text-sm text-slate-400">Estimated Duration: ~{Math.ceil(questionCount * 0.5)} mins</p>
                                    </div>

                                    {/* Smart Selection Toggle */}
                                    <div className="mt-6 md:mt-0">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={smartSelection}
                                                    onChange={(e) => setSmartSelection(e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                            </div>
                                            <div className="text-sm font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">
                                                Based on Memory Science (SRS)
                                            </div>
                                        </label>
                                        <p className="text-xs text-slate-400 mt-1 pl-14">
                                            Prioritizes overdue & difficult words
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Sticky Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 z-50">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    {step > 1 ? (
                        <button
                            onClick={prevStep}
                            className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                            Back
                        </button>
                    ) : (
                        <div /> // Spacer
                    )}

                    {step < 4 ? (
                        <button
                            onClick={nextStep}
                            disabled={step === 3 && availableCount === 0}
                            className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next Step <ChevronRight size={20} />
                        </button>
                    ) : (
                        <button
                            onClick={handleStart}
                            disabled={loading || !isReady}
                            className="px-10 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Play size={20} fill="currentColor" />
                                    Start Session
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

