'use client';

import { useRef } from 'react';
import { UserProfile } from '@/types/profile';
import { Camera, User, Share2, Edit3, Save, Loader2, X } from 'lucide-react';

interface ProfileHeaderProps {
    profile: UserProfile | null;
    avatarPreview: string | null;
    isEditing: boolean;
    isSaving: boolean;
    activeTab: 'details' | 'security';
    onTabChange: (tab: 'details' | 'security') => void;
    onAvatarChange: (file: File | null) => void;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    isDirty: boolean;
    children?: React.ReactNode;
}

export default function ProfileHeader({
    profile,
    avatarPreview,
    isEditing,
    isSaving,
    activeTab,
    onTabChange,
    onAvatarChange,
    onEdit,
    onSave,
    onCancel,
    isDirty,
    children
}: ProfileHeaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const avatarSrc = avatarPreview || profile?.avatar_url;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('Image must be less than 2MB');
                return;
            }
            // Validate type
            if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
                alert('Only JPG and PNG images are allowed');
                return;
            }
            onAvatarChange(file);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'premium': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'verified': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            default: return 'text-blue-600 bg-blue-50 border-blue-200';
        }
    };

    return (
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200">
            {/* Banner Area */}
            <div className="h-48 bg-gradient-to-r from-slate-800 to-slate-700 relative">
                {/* Fallback pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
            </div>

            <div className="px-8 pb-4 relative">
                <div className="flex flex-col items-center -mt-16 mb-4">
                    {/* Centered Avatar */}
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full p-1.5 bg-white ring-1 ring-slate-100 shadow-xl">
                            <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 relative">
                                {avatarSrc ? (
                                    <img
                                        src={avatarSrc}
                                        alt={profile?.full_name || 'Avatar'}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                                        <User size={48} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Camera Icon - Only visible in Edit Mode */}
                        {isEditing && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-2 right-2 p-2 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-all cursor-pointer z-10"
                                title="Change Avatar"
                            >
                                <Camera size={18} />
                            </button>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png"
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                    </div>

                    {/* Name & Subtitle */}
                    <h1 className="text-2xl font-bold text-slate-900 mt-3">
                        {profile?.full_name || 'Unnamed User'}
                    </h1>
                    <div className="flex items-center gap-2 mt-1 text-slate-500 font-medium">
                        <span>@{profile?.username}</span>
                        <span>|</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${getStatusColor(profile?.account_status || 'active')}`}>
                            {profile?.account_status || 'active'}
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 mt-4">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={onCancel}
                                    disabled={isSaving}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    <X size={16} />
                                    Cancel
                                </button>
                                <button
                                    onClick={onSave}
                                    disabled={!isDirty || isSaving}
                                    className="px-6 py-2 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Save Changes
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={onEdit}
                                    className="px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
                                >
                                    <Edit3 size={16} />
                                    Edit Profile
                                </button>
                                <button
                                    className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-not-allowed opacity-70"
                                    title="Share feature coming soon"
                                >
                                    <Share2 size={16} />
                                    Share
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center justify-center gap-1 border-t border-slate-100 pt-1 mt-6">
                    <button
                        onClick={() => onTabChange('details')}
                        className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'details'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Profile Details
                    </button>
                    <button
                        onClick={() => onTabChange('security')}
                        className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'security'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Security
                    </button>
                </div>

                {/* Content Area - Rendered inside the same card, below tabs */}
                {children && (
                    <div className="pt-8 pb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}
