"use client";

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface CopyButtonProps {
    text: string;
    className?: string;
    iconSize?: number;
    color?: string; // e.g. 'text-white' or 'text-[#101d23]'
}

export default function CopyButton({ text, className = '', iconSize = 20, color = '' }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy!', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={`transition-all duration-200 p-2 rounded-lg hover:bg-black/5 ${color} ${className}`}
            title="Copy"
        >
            <div className="relative flex items-center justify-center">
                <Copy
                    size={iconSize}
                    className={`transition-all duration-300 ${copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
                />
                <Check
                    size={iconSize}
                    className={`absolute inset-0 transition-all duration-300 text-emerald-500 ${copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
                />
            </div>
        </button>
    );
}
