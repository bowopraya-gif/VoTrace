"use client";

import { PRACTICE_MODES } from '@/types/practice';
import { ListChecks, Keyboard, Headphones, Shuffle, Grid2X2 } from 'lucide-react';
import Link from 'next/link';

const ICON_MAP: Record<string, any> = {
    'multiple_choice': ListChecks,
    'typing': Keyboard,
    'listening': Headphones,
    'mixed': Shuffle,
    'matching': Grid2X2,
};

const COLOR_MAP: Record<string, string> = {
    'blue': 'text-blue-600 bg-blue-50 border-blue-200 hover:border-blue-300 hover:shadow-blue-100',
    'purple': 'text-purple-600 bg-purple-50 border-purple-200 hover:border-purple-300 hover:shadow-purple-100',
    'emerald': 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:border-emerald-300 hover:shadow-emerald-100',
    'orange': 'text-orange-600 bg-orange-50 border-orange-200 hover:border-orange-300 hover:shadow-orange-100',
    'teal': 'text-teal-600 bg-teal-50 border-teal-200 hover:border-teal-300 hover:shadow-teal-100',
};

export default function PracticeModeCards() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRACTICE_MODES.map((mode) => {
                const Icon = ICON_MAP[mode.mode];
                const colorClasses = COLOR_MAP[mode.color];

                return (
                    <Link
                        key={mode.mode}
                        href={`/practice/setup?mode=${mode.mode}`}
                        className={`
                            group relative flex items-start gap-4 p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-md
                            bg-white border-slate-200
                        `}
                    >
                        <div className={`p-4 rounded-xl transition-colors duration-300 ${colorClasses}`}>
                            <Icon size={32} />
                        </div>

                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors">
                                {mode.label}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                {mode.description}
                            </p>

                            <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                                Start Practice &rarr;
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
