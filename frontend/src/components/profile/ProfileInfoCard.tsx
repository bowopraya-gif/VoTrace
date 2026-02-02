'use client';

import { ProfileUpdatePayload } from '@/types/profile';
import { User, Calendar, AtSign, Award } from 'lucide-react';
import EnglishLevelProgress from './EnglishLevelProgress';

interface ProfileInfoCardProps {
    formData: ProfileUpdatePayload;
    onFieldChange: (field: keyof ProfileUpdatePayload, value: string) => void;
    isEditing: boolean;
    usernameStatus: 'idle' | 'checking' | 'available' | 'taken';
    checkUsername: (username: string) => void;
}

const cefrLevels = {
    A1: { label: 'A1 - Beginner', desc: 'Can understand and use familiar everyday expressions.', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    A2: { label: 'A2 - Elementary', desc: 'Can communicate in simple and routine tasks.', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    B1: { label: 'B1 - Intermediate', desc: 'Can deal with most travel situations.', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    B2: { label: 'B2 - Upper Intermediate', desc: 'Can interact with fluency and spontaneity.', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    C1: { label: 'C1 - Advanced', desc: 'Can use language flexibly and effectively.', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    C2: { label: 'C2 - Proficient', desc: 'Can understand virtually everything heard or read.', color: 'bg-pink-100 text-pink-700 border-pink-200' },
};

export default function ProfileInfoCard({
    formData,
    onFieldChange,
    isEditing,
    usernameStatus,
    checkUsername
}: ProfileInfoCardProps) {

    // Helper to resolve level
    const currentLevelKey = (formData.english_level?.toString().trim().toUpperCase() as keyof typeof cefrLevels) || 'A1';
    // Ensure key exists in map, fallback to A1
    const currentLevel = cefrLevels[currentLevelKey] || cefrLevels['A1'];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
            {/* Full Name */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Full Name
                </label>
                <div className="relative group">
                    <input
                        type="text"
                        value={formData.full_name || ''}
                        disabled={!isEditing}
                        onChange={(e) => onFieldChange('full_name', e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-slate-700 font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all disabled:bg-slate-50 disabled:text-slate-500 pr-10"
                        placeholder="Your full name"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <User size={18} />
                    </div>
                </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    Username
                    {isEditing && usernameStatus !== 'idle' && (
                        <span className={`text-[10px] normal-case ${usernameStatus === 'available' ? 'text-green-600' :
                            usernameStatus === 'taken' ? 'text-red-500' : 'text-slate-400'
                            }`}>
                            {usernameStatus === 'checking' ? 'Checking...' :
                                usernameStatus === 'available' ? 'Available' : 'Taken'}
                        </span>
                    )}
                </label>
                <div className="relative group">
                    <input
                        type="text"
                        value={formData.username || ''}
                        disabled={!isEditing}
                        onChange={(e) => {
                            onFieldChange('username', e.target.value);
                            checkUsername(e.target.value);
                        }}
                        className={`w-full px-4 py-3.5 rounded-xl border outline-none font-medium transition-all disabled:bg-slate-50 disabled:text-slate-500 pr-10 ${!isEditing ? 'border-slate-200 text-slate-700' :
                            usernameStatus === 'taken' ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' :
                                usernameStatus === 'available' ? 'border-green-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10' :
                                    'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10'
                            }`}
                        placeholder="username"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <AtSign size={18} />
                    </div>
                </div>
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Date of Birth
                </label>
                <div className="relative group">
                    <input
                        type="date"
                        value={formData.date_of_birth || ''}
                        disabled={!isEditing}
                        onChange={(e) => onFieldChange('date_of_birth', e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-slate-700 font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all disabled:bg-slate-50 disabled:text-slate-500 pr-10 appearance-none"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Calendar size={18} />
                    </div>
                </div>
            </div>

            {/* English Level (Display Badge) */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Current Level
                </label>
                <div className="relative group hover:z-50">
                    <div
                        className={`w-full px-4 py-3.5 rounded-xl border flex items-center justify-between transition-colors ${currentLevel.color} cursor-help`}
                    >
                        <span className="font-bold">{currentLevel.label}</span>
                        <Award size={18} />
                    </div>
                    {/* Modern Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 text-center text-xs p-3 rounded-xl bg-slate-800 text-white shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50 pointer-events-none">
                        <div className="font-bold uppercase tracking-wider mb-1 text-slate-300 text-[10px]">
                            {currentLevel.label}
                        </div>
                        <div className="leading-tight text-slate-100 font-medium">
                            {currentLevel.desc}
                        </div>
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 rotate-45" />
                    </div>
                </div>
            </div>

            {/* English Level Progress (Interactive Bar) */}
            <div className="space-y-4 md:col-span-2 md:mt-2 border-t border-slate-100 pt-6">
                <div className="flex items-center justify-between">
                    {isEditing && (
                        <span className="text-xs text-primary font-medium bg-primary/5 px-2 py-0.5 rounded">
                            Select your current level below
                        </span>
                    )}
                </div>
                <div className="px-2 pb-2">
                    <EnglishLevelProgress
                        currentLevel={currentLevelKey}
                        onChange={(level) => onFieldChange('english_level', level)}
                        readOnly={!isEditing}
                    />
                </div>
            </div>
        </div>
    );
}
