import React from 'react';
import { Vocabulary, LEARNING_STATUS_OPTIONS } from '@/types/vocabulary';
import { Volume2, BookOpen, Quote, Languages } from 'lucide-react';

interface Props {
    vocabulary: Partial<Vocabulary>;
}

export const VocabularyPreview: React.FC<Props> = ({ vocabulary }) => {
    const statusConfig = LEARNING_STATUS_OPTIONS.find(opt => opt.value === vocabulary.learning_status);

    return (
        <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-xl shadow-slate-200/50 border border-white/60 p-8 sticky top-6 ring-1 ring-white/50 transition-all hover:shadow-2xl hover:shadow-slate-300/40">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Preview Card</h3>
                {statusConfig && (
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${statusConfig.color} bg-opacity-50`}>
                        {statusConfig.label}
                    </span>
                )}
            </div>

            <div className="space-y-8">
                <div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold text-slate-900 break-all leading-tight tracking-tight">
                            {vocabulary.english_word || <span className="text-slate-200 italic">New Word</span>}
                        </h1>
                        {vocabulary.part_of_speech && (
                            <span className="text-sm font-medium text-slate-500 italic inline-block bg-slate-100 px-2 py-0.5 rounded-md">
                                {vocabulary.part_of_speech}
                            </span>
                        )}
                    </div>
                    {vocabulary.pronunciation && (
                        <div className="flex items-center gap-2 mt-3 text-slate-500">
                            <Volume2 size={18} className="text-primary/70" />
                            <span className="font-mono text-base bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{vocabulary.pronunciation}</span>
                        </div>
                    )}
                </div>

                <div className="pt-6 border-t border-slate-100/80">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Languages size={14} /> Translation
                    </h4>
                    <p className="text-xl text-slate-800 font-medium leading-relaxed">
                        {vocabulary.translation || <span className="text-slate-300 italic">...</span>}
                    </p>
                </div>

                {(vocabulary.example_sentences && vocabulary.example_sentences.length > 0) && (
                    <div className="pt-6 border-t border-slate-100/80">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Quote size={14} /> Examples
                        </h4>
                        <div className="space-y-4">
                            {vocabulary.example_sentences.map((ex, idx) => (
                                ex.sentence && (
                                    <div key={idx} className="bg-slate-50/80 p-4 rounded-xl text-sm border border-slate-100 hover:bg-blue-50/50 transition-colors">
                                        <p className="text-slate-800 font-medium font-serif italic text-base">"{ex.sentence}"</p>
                                        {ex.translation && (
                                            <p className="text-slate-500 mt-2 text-xs flex items-center gap-2">
                                                <span className="w-2 h-px bg-slate-300"></span>
                                                {ex.translation}
                                            </p>
                                        )}
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                )}

                {(vocabulary.usage_note) && (
                    <div className="pt-6 border-t border-slate-100/80 flex gap-3">
                        <div className="p-2 bg-amber-50 rounded-lg h-fit text-amber-500">
                            <BookOpen size={18} />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-amber-600/70 uppercase tracking-widest mb-1">Usage Note</h4>
                            <p className="text-sm text-slate-600 leading-relaxed bg-amber-50/30 p-3 rounded-xl border border-amber-100/50">
                                {vocabulary.usage_note}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
