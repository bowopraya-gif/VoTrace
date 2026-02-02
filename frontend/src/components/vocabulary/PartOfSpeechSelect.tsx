import React from 'react';
import { PartOfSpeech, PART_OF_SPEECH_OPTIONS } from '@/types/vocabulary';
import { ChevronDown } from 'lucide-react';

interface Props {
    value: PartOfSpeech;
    onChange: (value: PartOfSpeech) => void;
    error?: string;
}

export const PartOfSpeechSelect: React.FC<Props> = ({ value, onChange, error }) => {
    return (
        <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-700 block">
                Part of Speech
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value as PartOfSpeech)}
                    className={`
            w-full appearance-none rounded-lg border bg-white px-3 py-2 text-sm
            focus:outline-none focus:ring-1 focus:ring-primary
            cursor-pointer
            ${error ? 'border-error ring-error' : 'border-neutral-300 focus:border-primary'}
          `}
                >
                    <option value="" disabled>Select Part of Speech</option>
                    {PART_OF_SPEECH_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                    <ChevronDown size={16} />
                </div>
            </div>
            {error && <p className="text-xs text-error">{error}</p>}
        </div>
    );
};
