'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Save, Keyboard, BookOpen, Quote, Languages } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { PartOfSpeechSelect } from '@/components/vocabulary/PartOfSpeechSelect';
import { LearningStatusChips } from '@/components/vocabulary/LearningStatusChips';
import { ExampleSentencesInput } from '@/components/vocabulary/ExampleSentencesInput';
import { VocabularyPreview } from '@/components/vocabulary/VocabularyPreview';
import { DisambiguationModal } from '@/components/vocabulary/DisambiguationModal';
import { useVocabularyStore } from '@/stores/vocabularyStore';
import { useAuthStore } from '@/stores/authStore';
import { Vocabulary, PartOfSpeech, LearningStatus } from '@/types/vocabulary';

export default function AddVocabularyPage() {
    const router = useRouter();
    const { addVocabulary, generateFromAI, isLoading } = useVocabularyStore();
    const { user, isLoading: authLoading, fetchUser } = useAuthStore();

    // Auth check
    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [authLoading, user, router]);

    const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');

    // AI Assist State
    const [aiWord, setAiWord] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Vocabulary>>({
        english_word: '',
        translation: '',
        pronunciation: '',
        part_of_speech: 'noun',
        learning_status: 'learning',
        usage_note: '',
        personal_notes: '',
        example_sentences: []
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [showDisambiguation, setShowDisambiguation] = useState(false);
    const [disambiguationOptions, setDisambiguationOptions] = useState<Partial<Vocabulary>[]>([]);

    const handleAiGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiWord) return;

        setIsAiLoading(true);
        setError('');

        try {
            const response = await generateFromAI(aiWord);

            if (response.status === 'ambiguous' && response.options) {
                // Show disambiguation modal
                setDisambiguationOptions(response.options);
                setShowDisambiguation(true);
            } else if (response.data) {
                // Single result - fill form directly
                applyVocabularyData(response.data);
            }
        } catch (err: any) {
            setError('Could not generate vocabulary. Please try manual input.');
            setTimeout(() => setError(''), 5000);
        } finally {
            setIsAiLoading(false);
        }
    };

    const applyVocabularyData = (data: Partial<Vocabulary>) => {
        setFormData(prev => ({
            ...prev,
            ...data,
            example_sentences: data.example_sentences || []
        }));

        setActiveTab('manual');
        setSuccess('✨ AI generated complete vocabulary!');
        setTimeout(() => setSuccess(''), 5000);
    };

    const handleDisambiguationSelect = (option: Partial<Vocabulary>) => {
        setShowDisambiguation(false);
        applyVocabularyData(option);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.english_word || !formData.translation) {
            setError('English word and Translation are required.');
            setTimeout(() => setError(''), 5000);
            return;
        }

        if (!formData.example_sentences || formData.example_sentences.length === 0) {
            setError('Please add at least one example sentence.');
            setTimeout(() => setError(''), 5000);
            return;
        }

        try {
            await addVocabulary(formData);
            setSuccess('Vocabulary saved successfully! Redirecting...');
            setTimeout(() => {
                router.push('/vocabulary');
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save vocabulary.');
            setTimeout(() => setError(''), 5000);
        }
    };

    const updateField = (field: keyof Vocabulary, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Don't render if not authenticated
    if (!user) return null;

    return (
        <div className="min-h-screen pb-12">
            <DisambiguationModal
                isOpen={showDisambiguation}
                options={disambiguationOptions}
                onSelect={handleDisambiguationSelect}
                onClose={() => setShowDisambiguation(false)}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <Link href="/vocabulary" className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
                        <div className="p-2.5 bg-white/50 backdrop-blur-sm rounded-xl border border-white/60 group-hover:border-primary/50 group-hover:bg-white group-hover:text-primary transition-all shadow-sm group-hover:shadow-md">
                            <ArrowLeft size={18} />
                        </div>
                        <span className="font-semibold text-sm">Back to Collection</span>
                    </Link>
                </div>

                {/* Notifications Area */}
                <div className="mb-6 max-w-2xl mx-auto">
                    <AnimatePresence>
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                <Alert type="error">{error}</Alert>
                            </motion.div>
                        )}
                        {success && (
                            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                <Alert type="success">{success}</Alert>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Centered Tabs */}
                <div className="flex justify-center mb-12">
                    <div className="bg-slate-100 p-1.5 rounded-xl inline-flex relative border border-slate-200 shadow-inner">
                        <motion.div
                            className="absolute bg-white rounded-xl shadow-sm border border-slate-100"
                            initial={false}
                            animate={{
                                x: activeTab === 'manual' ? 0 : '100%',
                                width: 'calc(50% - 6px)'
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            style={{ top: '6px', bottom: '6px', left: '6px' }}
                        />

                        <button
                            onClick={() => setActiveTab('manual')}
                            className={`relative z-10 px-8 py-3 text-[15px] font-semibold tracking-wide rounded-xl transition-colors duration-200 flex items-center justify-center min-w-[170px] ${activeTab === 'manual' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Manual Input
                        </button>
                        <button
                            onClick={() => setActiveTab('ai')}
                            className={`relative z-10 px-8 py-3 text-[15px] font-semibold tracking-wide rounded-xl transition-colors duration-200 flex items-center justify-center min-w-[170px] ${activeTab === 'ai' ? 'text-violet-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            AI Assist
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LEFT COLUMN: FORM */}
                    <div className="lg:col-span-7 xl:col-span-8">
                        <AnimatePresence mode="wait">
                            {activeTab === 'ai' ? (
                                <motion.div
                                    key="ai"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.3 }}
                                    className="backdrop-blur-xl bg-white/70 p-10 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50 ring-1 ring-white/40"
                                >
                                    <div className="text-center mb-10">
                                        <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-violet-500/20 rotate-3 hover:rotate-6 transition-all duration-500 hover:shadow-violet-500/40 hover:scale-105">
                                            <Sparkles className="text-white" size={40} />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900">Votrum AI</h2>
                                        <p className="text-slate-500 mt-2 max-w-md mx-auto text-lg leading-relaxed">
                                            Experience the power of VoTrum AI. Our engine synthesizes meaning, phonetics, and real-world usage to craft perfect vocabulary cards in seconds.
                                        </p>
                                    </div>

                                    <form onSubmit={handleAiGenerate} className="max-w-lg mx-auto space-y-8">
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                                <Sparkles className="text-violet-500" size={24} />
                                            </div>
                                            <input
                                                className="w-full pl-14 pr-6 py-5 rounded-2xl border border-slate-200 bg-white/80 focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 text-xl font-medium transition-all shadow-sm group-hover:shadow-md"
                                                placeholder="Type a word (e.g. Serendipity)..."
                                                value={aiWord}
                                                onChange={(e) => setAiWord(e.target.value)}
                                                autoFocus
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            fullWidth
                                            size="lg"
                                            variant="primary"
                                            className="h-16 text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 border-none"
                                            isLoading={isAiLoading}
                                            disabled={!aiWord}
                                        >
                                            {isAiLoading ? 'Summoning knowledge...' : 'Generate Magic'}
                                        </Button>
                                    </form>
                                </motion.div>
                            ) : (
                                <motion.form
                                    key="manual"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                    onSubmit={handleSubmit}
                                    className="backdrop-blur-xl bg-white/80 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50 ring-1 ring-white/50 overflow-hidden"
                                >

                                    <div className="p-10 space-y-12">

                                        {/* Section 1: Basic Info */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 pb-3 border-b border-slate-100/80">
                                                <h3 className="text-lg font-bold text-slate-900">Word Details</h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <Input
                                                    label="English Word"
                                                    placeholder="e.g., Ephemeral"
                                                    value={formData.english_word}
                                                    onChange={(e) => updateField('english_word', e.target.value)}
                                                    required
                                                    className="text-lg font-semibold bg-white/50"
                                                />
                                                <Input
                                                    label="Pronunciation"
                                                    placeholder="e.g., /əˈfem(ə)rəl/"
                                                    value={formData.pronunciation || ''}
                                                    onChange={(e) => updateField('pronunciation', e.target.value)}
                                                    className="font-mono text-slate-600 bg-white/50"
                                                />
                                            </div>
                                            <Input
                                                label="Indonesian Translation"
                                                placeholder="e.g., Tidak kekal, sementara"
                                                value={formData.translation}
                                                onChange={(e) => updateField('translation', e.target.value)}
                                                required
                                                className="bg-white/50 text-base"
                                            />
                                        </div>

                                        {/* Section 2: Classification */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 pb-3 border-b border-slate-100/80">
                                                <h3 className="text-lg font-bold text-slate-900">Classification</h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                <PartOfSpeechSelect
                                                    value={formData.part_of_speech as PartOfSpeech}
                                                    onChange={(val) => updateField('part_of_speech', val)}
                                                />
                                                <LearningStatusChips
                                                    value={formData.learning_status as LearningStatus}
                                                    onChange={(val) => updateField('learning_status', val)}
                                                />
                                            </div>
                                        </div>

                                        {/* Section 3: Context */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 pb-3 border-b border-slate-100/80">
                                                <h3 className="text-lg font-bold text-slate-900">Context & Usage</h3>
                                            </div>

                                            <ExampleSentencesInput
                                                sentences={formData.example_sentences || []}
                                                onChange={(val) => updateField('example_sentences', val)}
                                            />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <label className="text-sm font-bold text-slate-700 ml-1">Usage Note</label>
                                                    <textarea
                                                        className="w-full rounded-2xl border border-slate-200 bg-amber-50/30 px-5 py-4 text-sm focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all resize-none h-32 placeholder:text-slate-400"
                                                        placeholder="e.g., Used mostly in formal contexts..."
                                                        value={formData.usage_note || ''}
                                                        onChange={(e) => updateField('usage_note', e.target.value)}
                                                    />
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-sm font-bold text-slate-700 ml-1">Personal Notes</label>
                                                    <textarea
                                                        className="w-full rounded-2xl border border-slate-200 bg-emerald-50/30 px-5 py-4 text-sm focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none h-32 placeholder:text-slate-400"
                                                        placeholder="e.g., Remember this for the exam..."
                                                        value={formData.personal_notes || ''}
                                                        onChange={(e) => updateField('personal_notes', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-8 flex justify-center">
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                size="lg"
                                                className="px-12 w-full md:w-auto min-w-[240px] text-lg font-bold shadow-xl shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98]"
                                                isLoading={isLoading}
                                                icon={Save}
                                            >
                                                Save Vocabulary
                                            </Button>
                                        </div>

                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* RIGHT COLUMN: PREVIEW */}
                    <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                        <div className="sticky top-24 space-y-6">
                            <motion.div
                                layout
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="relative z-0"
                            >
                                <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-3xl -z-10 transform rotate-2 scale-[1.02]"></div>
                                <VocabularyPreview vocabulary={formData} />
                            </motion.div>

                            {activeTab === 'ai' && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="p-5 bg-blue-50/80 backdrop-blur-sm border border-blue-100 rounded-2xl text-sm text-blue-800 text-center font-medium shadow-sm"
                                >
                                    The preview updates automatically when our AI finds your word.
                                </motion.div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
