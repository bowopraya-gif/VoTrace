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
        <div className="bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden transition-all font-sans relative z-0">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>

            {/* 1. Detail Header */}
            {/* 1. Detail Header - Modern Gradient Design */}
            <div className="relative px-6 py-8 md:px-8 md:py-10 text-center overflow-hidden">
                {/* Solid Primary Background */}
                <div className="absolute inset-0 bg-primary"></div>

                <div className="relative z-10 space-y-2">
                    {/* Word Title */}
                    <div className="flex justify-center">
                        <InlineEditField
                            value={formData.english_word}
                            isEditing={isEditing}
                            onChange={(val) => updateField('english_word', val)}
                            className="text-4xl md:text-7xl font-black text-white tracking-tight leading-tight bg-transparent text-center drop-shadow-sm"
                            inputClassName="text-4xl md:text-7xl font-black text-center h-auto py-4 text-slate-900"
                            required
                        />
                    </div>

                    {/* Pronunciation (Below Word) */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <InlineEditField
                            value={formData.pronunciation || ''}
                            isEditing={isEditing}
                            onChange={(val) => updateField('pronunciation', val)}
                            placeholder="/pronunciation/"
                            className="text-lg md:text-2xl font-serif italic text-blue-200/90 bg-transparent text-center"
                            inputClassName="text-lg md:text-2xl font-serif italic text-center text-slate-500"
                        />
                        {!isEditing && formData.audio_url && (
                            <button
                                onClick={() => {
                                    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
                                    const url = formData.audio_url?.startsWith('http')
                                        ? formData.audio_url
                                        : `${baseUrl}${formData.audio_url?.startsWith('/') ? '' : '/'}${formData.audio_url}`;
                                    new Audio(url).play().catch(e => console.error("Audio playback failed", e));
                                }}
                                className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-blue-200 hover:text-white"
                                title="Play Pronunciation"
                            >
                                <Volume2 size={20} />
                            </button>
                        )}
                    </div>

                    {/* Glassmorphism Badges Row */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2 mt-5">
                        {/* 1. Category Badge */}
                        <div className="flex items-center justify-center px-2 py-1 md:px-4 md:py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white/90 text-xs md:text-sm font-medium shadow-sm min-w-[80px] h-[34px] md:min-w-[120px] md:h-[42px]">
                            <InlineEditField
                                type="select"
                                value={formData.part_of_speech}
                                isEditing={isEditing}
                                onChange={(val) => updateField('part_of_speech', val)}
                                options={PART_OF_SPEECH_OPTIONS}
                                className="bg-transparent capitalize text-center"
                                inputClassName="text-slate-700"
                            />
                        </div>

                        {/* 2. Status Badge */}
                        <div className="flex items-center justify-center px-2 py-1 md:px-4 md:py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white/90 text-xs md:text-sm font-medium shadow-sm min-w-[80px] h-[34px] md:min-w-[120px] md:h-[42px]">
                            <InlineEditField
                                type="select"
                                value={formData.learning_status}
                                isEditing={isEditing}
                                onChange={(val) => updateField('learning_status', val)}
                                options={LEARNING_STATUS_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))}
                                className="bg-transparent capitalize text-center"
                                inputClassName="text-slate-700"
                            />
                        </div>

                        {/* 3. Date Badge (Restored) */}
                        <div className="flex items-center justify-center px-2 py-1 md:px-4 md:py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white/90 text-xs md:text-sm font-medium shadow-sm min-w-[80px] h-[34px] md:min-w-[120px] md:h-[42px]">
                            <span>{formatDate(formData.created_at)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-5 md:p-10 space-y-8 md:space-y-10 bg-slate-50/30">
                {/* 2. Detail Grid - Meaning & POS */}
                {/* 2. Primary Definition Section (Meaning + Usage) */}
                {/* 2. Primary Definition Section (Meaning + Usage) */}
                <div className="bg-white rounded-3xl p-5 md:p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 text-center space-y-2 relative z-10">
                    {/* Meaning / Translation */}
                    <div>
                        <InlineEditField
                            value={formData.translation}
                            isEditing={isEditing}
                            onChange={(val) => updateField('translation', val)}
                            className="text-2xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight w-full bg-transparent text-center"
                            inputClassName="text-2xl md:text-5xl font-black text-slate-800 text-center"
                            placeholder="Translation"
                            required
                        />
                    </div>

                    {/* Usage Note / Description */}
                    <div className="max-w-3xl mx-auto">
                        {isFetchingDetails && !formData.usage_note ? (
                            <div className="animate-pulse space-y-2">
                                <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto"></div>
                                <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
                            </div>
                        ) : (
                            <InlineEditField
                                type="textarea"
                                value={formData.usage_note || ''}
                                isEditing={isEditing}
                                onChange={(val) => updateField('usage_note', val)}
                                className="text-sm md:text-xl text-slate-600 leading-relaxed w-full bg-transparent placeholder:text-slate-400 text-center"
                                inputClassName="text-sm md:text-xl text-slate-600 text-center min-h-[80px]"
                                placeholder="Add a usage note or definition..."
                            />
                        )}
                    </div>
                </div>

                {/* 3. Personal Notes Section */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden text-center group">
                    {/* Header */}
                    <div className="px-5 py-4 md:px-8 md:py-6 border-b border-slate-50 flex items-center justify-center bg-white">
                        <h2 className="text-lg md:text-lg font-bold text-slate-800">Personal Notes</h2>
                    </div>

                    {/* Content */}
                    <div className="p-5 md:p-8 min-h-[120px] flex items-center justify-center">
                        <InlineEditField
                            type="textarea"
                            value={formData.personal_notes || ''}
                            isEditing={isEditing}
                            onChange={(val) => updateField('personal_notes', val)}
                            className="text-sm md:text-base text-slate-600 leading-relaxed w-full bg-transparent h-full placeholder:italic text-center font-medium"
                            inputClassName="text-sm md:text-base text-slate-600 text-center"
                            placeholder="Add your personal notes here..."
                        />
                    </div>
                </div>

                {/* 4. Examples Section */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden text-left">
                    {/* Header */}
                    <div className="px-5 py-4 md:px-8 md:py-6 border-b border-slate-50 flex items-center justify-between bg-white text-left">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg md:text-lg font-bold text-slate-800">Example Sentences</h2>
                        </div>
                        <div className="px-3 py-1 bg-slate-50 rounded-full border border-slate-100 text-xs font-semibold text-slate-500">
                            {formData.example_sentences?.length || 0} Examples
                        </div>
                    </div>

                    {/* Content List */}
                    <div className="p-0 text-left">
                        {isFetchingDetails && (!formData.example_sentences || formData.example_sentences.length === 0) ? (
                            <div className="p-5 md:p-8 space-y-8">
                                {[...Array(2)].map((_, i) => (
                                    <div key={i} className="animate-pulse space-y-3">
                                        <div className="h-6 bg-slate-100 rounded w-3/4"></div>
                                        <div className="h-4 bg-slate-50 rounded w-1/2"></div>
                                    </div>
                                ))}
                            </div>
                        ) : isEditing ? (
                            <div className="p-5 md:p-8">
                                <ExampleSentencesInput
                                    sentences={formData.example_sentences || []}
                                    onChange={(sentences) => updateField('example_sentences', sentences)}
                                />
                            </div>
                        ) : (
                            formData.example_sentences?.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {formData.example_sentences.map((ex, idx) => (
                                        <div key={idx} className="p-5 md:p-8 group hover:bg-slate-50/30 transition-colors text-left">
                                            {/* English Sentence */}
                                            <p className="text-base md:text-xl text-slate-800 font-serif italic mb-3 leading-relaxed">
                                                "{ex.sentence}"
                                            </p>
                                            {/* Translation */}
                                            {ex.translation && (
                                                <div className="flex items-start gap-3 pl-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></div>
                                                    <p className="text-xs md:text-base text-slate-500 font-medium leading-relaxed">{ex.translation}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                        <FileText size={24} />
                                    </div>
                                    <p className="text-slate-400 italic">No example sentences added yet.</p>
                                    <p className="text-slate-300 text-sm mt-1">Edit to add examples</p>
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
