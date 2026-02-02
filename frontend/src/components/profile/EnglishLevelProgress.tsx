'use client';

import { cn } from '@/lib/utils';

interface EnglishLevelProgressProps {
    currentLevel: string;
    onChange?: (level: string) => void;
    readOnly?: boolean;
}

const levels = [
    { id: 'A1', label: 'Beginner', desc: 'Can understand and use familiar everyday expressions.', color: 'bg-emerald-500', ring: 'ring-emerald-500/20' },
    { id: 'A2', label: 'Elementary', desc: 'Can communicate in simple and routine tasks.', color: 'bg-emerald-600', ring: 'ring-emerald-600/20' },
    { id: 'B1', label: 'Intermediate', desc: 'Can deal with most travel situations.', color: 'bg-blue-500', ring: 'ring-blue-500/20' },
    { id: 'B2', label: 'Upper Int.', desc: 'Can interact with fluency and spontaneity.', color: 'bg-blue-600', ring: 'ring-blue-600/20' },
    { id: 'C1', label: 'Advanced', desc: 'Can use language flexibly and effectively.', color: 'bg-purple-500', ring: 'ring-purple-500/20' },
    { id: 'C2', label: 'Proficient', desc: 'Can understand virtually everything heard or read.', color: 'bg-pink-500', ring: 'ring-pink-500/20' },
];

export default function EnglishLevelProgress({ currentLevel, onChange, readOnly = false }: EnglishLevelProgressProps) {
    const currentIndex = levels.findIndex(l => l.id === currentLevel);
    // Safety check - if level not found (e.g. legacy data), default to -1 or 0
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;

    return (
        <div className="w-full py-6 select-none relative z-0">
            <div className="relative flex items-center justify-between w-full h-[60px]">
                {/* Background Line - Darker and wider z-index fix */}
                <div className="absolute left-0 right-0 h-2 bg-slate-200 top-1/2 -translate-y-1/2 -z-10 rounded-full" />

                {/* Active Progress Line */}
                <div
                    className={cn(
                        "absolute left-0 h-2 top-1/2 -translate-y-1/2 -z-10 rounded-full transition-all duration-500 ease-out",
                        levels[safeIndex].color
                    )}
                    style={{ width: `${(safeIndex / (levels.length - 1)) * 100}%` }}
                />

                {levels.map((level, index) => {
                    const isActive = index <= safeIndex;
                    const isCurrent = index === safeIndex;

                    return (
                        <div key={level.id} className="relative group">
                            <button
                                onClick={() => !readOnly && onChange?.(level.id)}
                                disabled={readOnly}
                                className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 relative z-10 border-2",
                                    isActive
                                        ? `border-transparent text-white shadow-lg ${level.color}`
                                        : "bg-white border-slate-300 text-slate-400 hover:border-slate-400",
                                    isCurrent && `scale-110 ring-4 ring-offset-2 ${level.ring}`,
                                    !readOnly && !isActive && "hover:scale-105 cursor-pointer",
                                    !readOnly && isActive && "cursor-pointer",
                                    readOnly && "cursor-default"
                                )}
                            >
                                {level.id}
                            </button>

                            {/* Hover Label (Tooltip) - Visible on hover for ALL nodes to explain meaning */}
                            <div className={cn(
                                "absolute -bottom-14 left-1/2 -translate-x-1/2 w-48 text-center text-xs p-3 rounded-xl bg-slate-800 text-white shadow-xl transition-all duration-200 transform z-20 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto"
                            )}>
                                <div className="font-bold uppercase tracking-wider mb-1 text-slate-300 text-[10px]">
                                    {level.label}
                                </div>
                                <div className="leading-tight text-slate-100 font-medium">
                                    {level.desc}
                                </div>
                                {/* Arrow */}
                                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 rotate-45" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
