import React from 'react';
import { LearningStatus, LEARNING_STATUS_OPTIONS } from '@/types/vocabulary';
import { Check } from 'lucide-react';

interface Props {
    value: LearningStatus;
    onChange: (value: LearningStatus) => void;
}

export const LearningStatusChips: React.FC<Props> = ({ value, onChange }) => {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 block">
                Learning Status
            </label>
            <div className="flex flex-wrap gap-2">
                {LEARNING_STATUS_OPTIONS.map((option) => {
                    const isSelected = value === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onChange(option.value)}
                            className={`
                relative px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200
                flex items-center gap-2
                ${isSelected
                                    ? `${option.color} ring-2 ring-primary ring-offset-1`
                                    : 'bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-50'
                                }
              `}
                        >
                            {isSelected && <Check size={14} />}
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
