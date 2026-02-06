'use client';

import { motion } from 'framer-motion';
import { StatsPeriod, PERIOD_OPTIONS } from '@/types/statistics';
import { CalendarRange } from 'lucide-react';

interface PeriodSelectorProps {
    value: StatsPeriod;
    onChange: (period: StatsPeriod) => void;
}

export default function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
    return (
        <div className="grid grid-cols-4 w-full md:w-auto md:flex bg-slate-100 p-1 rounded-2xl items-center gap-1">
            {PERIOD_OPTIONS.map((option) => {
                const isActive = value === option.value;
                return (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={`
                            relative px-1 py-2 md:px-4 rounded-xl text-sm font-bold transition-all duration-200 z-10 whitespace-nowrap flex justify-center items-center
                            ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}
                        `}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="activePeriod"
                                className="absolute inset-0 bg-white rounded-xl shadow-sm"
                                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                style={{ zIndex: -1 }}
                            />
                        )}
                        <span className="truncate">{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
