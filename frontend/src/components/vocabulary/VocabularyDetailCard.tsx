'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Edit2, Save, X, Trash2, Volume2, ArrowLeft,
    Book, FileText, Tag, MessageSquare, Calendar, Info, Languages, BookOpen
} from 'lucide-react';
import { useVocabularyStore } from '@/stores/vocabularyStore';
import { Vocabulary, PART_OF_SPEECH_OPTIONS, LEARNING_STATUS_OPTIONS } from '@/types/vocabulary';
import { Button } from '@/components/ui/Button';
import { InlineEditField } from './InlineEditField';
import { ExampleSentencesInput } from './ExampleSentencesInput';

interface Props {
    vocabulary: Vocabulary;
    isFetchingDetails?: boolean;
}

export const VocabularyDetailCard: React.FC<Props> = ({ vocabulary: initialData, isFetchingDetails = false }) => {
    const router = useRouter();
    const { updateVocabulary, deleteVocabulary } = useVocabularyStore();

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<Vocabulary>(initialData);

    // Sync formData when initialData changes (e.g. from cached partial to full fetched)
    React.useEffect(() => {
        setFormData(initialData);
    }, [initialData]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateVocabulary(initialData.id!, formData);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save', error);
            // Ideally show toast here
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData(initialData);
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this vocabulary? This action cannot be undone.')) {
            try {
                await deleteVocabulary(initialData.id!);
                router.push('/vocabulary');
            } catch (error) {
                console.error('Failed to delete', error);
            }
        }
    };

    const updateField = (field: keyof Vocabulary, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Unknown Date';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="backdrop-blur-3xl bg-white/80 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white/60 overflow-hidden ring-1 ring-white/50 transition-all font-sans relative z-0">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>

            {/* 1. Detail Header */}
            <div className="px-8 pt-10 pb-8 text-center relative border-b border-primary/20 bg-primary text-white">
                <div className="space-y-4">
                    {/* Word Title */}
                    <div className="relative inline-block">
                        <InlineEditField
                            value={formData.english_word}
                            isEditing={isEditing}
                            onChange={(val) => updateField('english_word', val)}
                            className="text-5xl md:text-6xl font-black text-white tracking-tight leading-tight bg-transparent text-center"
                            inputClassName="text-5xl md:text-6xl font-black text-center h-auto py-4 text-slate-900"
                            required
                        />
                        {/* Decorative Underline */}
                        {!isEditing && (
                            <div className="absolute -bottom-2 left-0 right-0 h-1.5 bg-white/20 rounded-full blur-[1px]"></div>
                        )}
                    </div>

                    {/* Pronunciation */}
                    <div className="flex items-center justify-center gap-3 text-blue-100">
                        <InlineEditField
                            value={formData.pronunciation || ''}
                            isEditing={isEditing}
                            onChange={(val) => updateField('pronunciation', val)}
                            placeholder="/pronunciation/"
                            className="text-2xl font-serif italic text-blue-100 bg-transparent text-center"
                            inputClassName="text-2xl font-serif italic text-center text-slate-500"
                        />
                        {!isEditing && (
                            <button
                                onClick={() => {
                                    if (formData.audio_url) {
                                        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
                                        const url = formData.audio_url.startsWith('http')
                                            ? formData.audio_url
                                            : `${baseUrl}${formData.audio_url.startsWith('/') ? '' : '/'}${formData.audio_url}`;
                                        new Audio(url).play().catch(e => console.error("Audio playback failed", e));
                                    }
                                }}
                                disabled={!formData.audio_url}
                                className={`p-2 rounded-full hover:bg-white/10 transition-colors ${formData.audio_url ? 'text-white/80 cursor-pointer' : 'text-white/30 cursor-not-allowed'}`}
                                title={formData.audio_url ? "Play Pronunciation" : "No Audio Available"}
                            >
                                <Volume2 size={20} />
                            </button>
                        )}
                    </div>

                    {/* Badges Container */}
                    <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
                        {/* Category Badge */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20 shadow-sm text-white font-semibold text-sm backdrop-blur-sm">
                            <InlineEditField
                                type="select"
                                value={formData.part_of_speech}
                                isEditing={isEditing}
                                onChange={(val) => updateField('part_of_speech', val)}
                                options={PART_OF_SPEECH_OPTIONS}
                                className="bg-transparent text-sm font-semibold capitalize min-w-[60px] text-center"
                                inputClassName="text-slate-700"
                            />
                        </div>

                        {/* Status Badge */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm text-sm font-bold backdrop-blur-sm transition-colors bg-white/10 border-white/20 text-white`}>
                            <InlineEditField
                                type="select"
                                value={formData.learning_status}
                                isEditing={isEditing}
                                onChange={(val) => updateField('learning_status', val)}
                                options={LEARNING_STATUS_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))}
                                className="bg-transparent text-sm font-bold capitalize min-w-[80px]"
                                inputClassName="text-slate-700"
                            />
                        </div>

                        {/* Date Badge */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20 shadow-sm text-blue-100 font-medium text-sm backdrop-blur-sm">
                            <span>{formatDate(formData.created_at)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8 md:p-10 space-y-10 bg-slate-50/30">
                {/* 2. Detail Grid - Meaning & POS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Meaning Card */}
                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group text-center">
                        <div className="mb-4">
                            <h2 className="text-lg font-bold text-slate-800">Meaning</h2>
                        </div>
                        <div className="min-h-[60px] flex items-center justify-center">
                            <InlineEditField
                                value={formData.translation}
                                isEditing={isEditing}
                                onChange={(val) => updateField('translation', val)}
                                className="text-2xl font-medium text-slate-700 leading-relaxed w-full bg-transparent text-center"
                                inputClassName="text-2xl font-medium text-slate-700 text-center"
                                required
                            />
                        </div>
                    </div>

                    {/* Personal Notes Card */}
                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group text-center">
                        <div className="mb-4">
                            <h2 className="text-lg font-bold text-slate-800">Personal Notes</h2>
                        </div>
                        <div className="min-h-[60px]">
                            <InlineEditField
                                type="textarea"
                                value={formData.personal_notes || ''}
                                isEditing={isEditing}
                                onChange={(val) => updateField('personal_notes', val)}
                                className="text-base text-slate-600 leading-relaxed w-full bg-transparent h-full placeholder:italic text-center"
                                inputClassName="text-base text-slate-600 text-center"
                                placeholder="Add your personal notes here..."
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Usage Note Section */}
                <div className="bg-amber-50/40 backdrop-blur-xl rounded-3xl p-8 border border-amber-100/50 shadow-sm relative overflow-hidden group text-center">
                    {/* Decorative background icon */}
                    <BookOpen className="absolute -right-4 -bottom-4 text-amber-500/10 w-32 h-32 rotate-12 transition-transform group-hover:rotate-6 duration-500 pointer-events-none" />

                    <div className="mb-4 relative z-10">
                        <h2 className="text-lg font-bold text-slate-800">Usage Note</h2>
                    </div>
                    <div className="relative z-10">
                        {isFetchingDetails && !formData.usage_note ? (
                            <div className="animate-pulse space-y-2">
                                <div className="h-4 bg-amber-200/50 rounded w-3/4 mx-auto"></div>
                                <div className="h-4 bg-amber-200/50 rounded w-1/2 mx-auto"></div>
                            </div>
                        ) : (
                            <InlineEditField
                                type="textarea"
                                value={formData.usage_note || ''}
                                isEditing={isEditing}
                                onChange={(val) => updateField('usage_note', val)}
                                className="text-lg text-slate-700 leading-relaxed w-full bg-transparent placeholder:text-amber-800/30 text-center"
                                inputClassName="text-lg text-slate-700 text-center"
                                placeholder="Common contexts, origins, or distinct nuances..."
                            />
                        )}
                    </div>
                </div>

                {/* 4. Examples Section */}
                <div className="space-y-6 text-center">
                    <div className="flex items-center justify-center">
                        <h2 className="text-2xl font-bold text-slate-900">Example Sentences</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {isFetchingDetails && (!formData.example_sentences || formData.example_sentences.length === 0) ? (
                            // Skeleton for Examples
                            [...Array(2)].map((_, i) => (
                                <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm animate-pulse">
                                    <div className="h-5 bg-slate-200 rounded w-2/3 mx-auto mb-3"></div>
                                    <div className="h-4 bg-slate-100 rounded w-1/2 mx-auto pt-3 border-t border-slate-50"></div>
                                </div>
                            ))
                        ) : isEditing ? (
                            <div className="md:col-span-1">
                                <ExampleSentencesInput
                                    sentences={formData.example_sentences || []}
                                    onChange={(sentences) => updateField('example_sentences', sentences)}
                                />
                            </div>
                        ) : (
                            formData.example_sentences?.length > 0 ? (
                                formData.example_sentences.map((ex, idx) => (
                                    <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden text-center">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <p className="text-lg text-slate-800 font-medium font-serif italic mb-3 relative z-10">"{ex.sentence}"</p>
                                        {ex.translation && (
                                            <div className="pt-3 border-t border-slate-50 relative z-10">
                                                <p className="text-slate-500 text-sm font-medium">{ex.translation}</p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center bg-slate-100/50 rounded-3xl border border-dashed border-slate-200">
                                    <p className="text-slate-400 italic">No example sentences added yet.</p>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* 5. Footer Actions */}
                <div className="pt-8 border-t border-slate-200/60 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2 text-slate-400 text-sm font-medium bg-slate-100/50 px-4 py-2 rounded-full">
                        <Info size={14} />
                        Added on {formatDate(formData.created_at)}
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        {isEditing ? (
                            <>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                    className="flex-1 md:flex-none border-slate-300 hover:border-slate-400 hover:bg-white bg-white/50"
                                >
                                    <X size={18} className="mr-2" /> Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={handleSave}
                                    isLoading={isSaving}
                                    className="flex-1 md:flex-none px-8 shadow-xl shadow-primary/20 hover:shadow-primary/30"
                                >
                                    <Save size={18} className="mr-2" /> Save Changes
                                </Button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-red-500 font-bold hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                                >
                                    <Trash2 size={18} />
                                    <span className="hidden md:inline">Delete</span>
                                </button>
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={() => setIsEditing(true)}
                                    className="flex-1 md:flex-none px-10 shadow-lg shadow-primary/25 hover:shadow-primary/40 bg-slate-900 hover:bg-slate-800 text-white border-none"
                                >
                                    <Edit2 size={18} className="mr-2" /> Edit Vocabulary
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
