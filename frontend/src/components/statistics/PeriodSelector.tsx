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
        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 inline-flex items-center gap-1">
            <div className="px-3 text-slate-400">
                <CalendarRange size={16} />
            </div>
            {PERIOD_OPTIONS.map((option) => {
                const isActive = value === option.value;
                return (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={`
                            relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 z-10
                            ${isActive ? 'text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                        `}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="activePeriod"
                                className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.08)] border border-slate-100"
                                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                style={{ zIndex: -1 }}
                            />
                        )}
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
