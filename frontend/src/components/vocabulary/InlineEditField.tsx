'use client';

import React from 'react';

interface InlineEditFieldProps {
    value: string;
    isEditing: boolean;
    onChange: (value: string) => void;
    label?: string;
    type?: 'text' | 'textarea' | 'select';
    options?: { value: string; label: string }[];
    className?: string; // Text styling
    inputClassName?: string; // Specific styling for the input element
    placeholder?: string;
    required?: boolean;
}

export const InlineEditField: React.FC<InlineEditFieldProps> = ({
    value,
    isEditing,
    onChange,
    label,
    type = 'text',
    options = [],
    className = '',
    inputClassName = '',
    placeholder,
    required = false
}) => {
    if (!isEditing) {
        return (
            <div className={`py-2 border border-transparent ${className}`}>
                {type === 'select'
                    ? options.find(opt => opt.value === value)?.label || value
                    : value || <span className="text-neutral-400 italic text-sm">Empty</span>}
            </div>
        );
    }

    const commonClasses = "w-full rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all bg-white/50 backdrop-blur-sm focus:bg-white";

    return (
        <div className="w-full">
            {type === 'textarea' ? (
                <textarea
                    className={`${commonClasses} px-4 py-3 min-h-[100px] text-sm resize-none ${inputClassName}`}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    required={required}
                />
            ) : type === 'select' ? (
                <select
                    className={`${commonClasses} px-4 py-2 text-sm appearance-none cursor-pointer ${inputClassName}`}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={required}
                >
                    <option value="" disabled>Select {label}</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    type="text"
                    className={`${commonClasses} px-4 py-2 text-inherit font-inherit ${inputClassName}`}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    required={required}
                />
            )}
        </div>
    );
};
