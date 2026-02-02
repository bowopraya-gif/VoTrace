import React from 'react';
import { ExampleSentence } from '@/types/vocabulary';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
    sentences: ExampleSentence[];
    onChange: (sentences: ExampleSentence[]) => void;
}

export const ExampleSentencesInput: React.FC<Props> = ({ sentences, onChange }) => {
    const addSentence = () => {
        onChange([...sentences, { sentence: '', translation: '' }]);
    };

    const removeSentence = (index: number) => {
        onChange(sentences.filter((_, i) => i !== index));
    };

    const updateSentence = (index: number, field: keyof ExampleSentence, value: string) => {
        const newSentences = [...sentences];
        newSentences[index] = { ...newSentences[index], [field]: value };
        onChange(newSentences);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700">
                    Example Sentences
                </label>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addSentence}
                    className="text-primary hover:text-primary-dark"
                >
                    <Plus size={16} className="mr-1" />
                    Add Example
                </Button>
            </div>

            <div className="space-y-3">
                {sentences.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start group animate-fadeIn">
                        <div className="flex-1 space-y-2">
                            <input
                                type="text"
                                placeholder="English sentence"
                                value={item.sentence}
                                onChange={(e) => updateSentence(index, 'sentence', e.target.value)}
                                className="w-full text-sm rounded-md border border-neutral-300 px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            />
                            <input
                                type="text"
                                placeholder="Indonesian translation (optional)"
                                value={item.translation || ''}
                                onChange={(e) => updateSentence(index, 'translation', e.target.value)}
                                className="w-full text-sm rounded-md border border-dashed border-neutral-300 px-3 py-2 bg-neutral-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-neutral-600"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => removeSentence(index)}
                            className="mt-2 text-neutral-400 hover:text-error transition-colors p-1 rounded-full hover:bg-error/10"
                            title="Remove sentence"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}

                {sentences.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-neutral-200 rounded-lg text-neutral-400 text-sm">
                        No example sentences yet. Add one to contextualize your vocabulary.
                    </div>
                )}
            </div>
        </div>
    );
};
