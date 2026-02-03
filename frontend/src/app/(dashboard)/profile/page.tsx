'use client';

import { useState, useEffect, Suspense } from 'react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileInfoCard from '@/components/profile/ProfileInfoCard';
import PasswordChangeModal from '@/components/profile/PasswordChangeModal';
import { useProfileForm } from '@/hooks/useProfileForm';
import { useAuthStore } from '@/stores/authStore';
import { Lock, Shield, Mail, Loader2 } from 'lucide-react';

import { useSearchParams, useRouter } from 'next/navigation';

function ProfileContent() {
    const { user, fetchUser } = useAuthStore();
    const searchParams = useSearchParams();
    const router = useRouter();
    const refreshProfile = fetchUser;

    // Force refresh on mount to ensure DB sync
    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const [activeTab, setActiveTab] = useState<'details' | 'security'>('details');
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const {
        formData,
        updateField,
        isDirty,
        isEditing,
        isSaving,
        startEditing,
        cancelEdit,
        saveProfile,
        avatarPreview,
        handleAvatarChange,
        usernameStatus,
        checkUsername
    } = useProfileForm(user as any);

    // Auto-enable edit mode if ?edit=true
    useEffect(() => {
        if (searchParams.get('edit') === 'true') {
            startEditing();
        }
    }, [searchParams, startEditing]);

    const clearEditParam = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('edit');
        router.replace(`/profile?${params.toString()}`, { scroll: false });
    };

    const handleSave = async () => {
        const success = await saveProfile();
        if (success) {
            await refreshProfile();
            clearEditParam();
        }
    };

    const handleCancel = () => {
        cancelEdit();
        clearEditParam();
    };

    return (
        <div className="max-w-5xl mx-auto pb-12">

            <ProfileHeader
                profile={user as any}
                avatarPreview={avatarPreview}
                isEditing={isEditing}
                isSaving={isSaving}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onAvatarChange={handleAvatarChange}
                onEdit={startEditing}
                onSave={handleSave}
                onCancel={handleCancel}
                isDirty={isDirty}
            >
                {/* Content Rendered Inside Header Card */}
                {activeTab === 'details' ? (
                    <ProfileInfoCard
                        formData={formData}
                        onFieldChange={updateField}
                        isEditing={isEditing}
                        usernameStatus={usernameStatus}
                        checkUsername={checkUsername}
                    />
                ) : (
                    <div className="w-full max-w-4xl mx-auto min-h-[300px]">
                        <div className="grid gap-6">
                            <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-4">
                                <div className="p-3 bg-white rounded-lg shadow-sm text-blue-600">
                                    <Mail size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-slate-900">Email Address</h3>
                                    <p className="text-slate-500 text-sm mt-1">
                                        {user?.email}
                                    </p>
                                    <button disabled className="mt-4 px-4 py-2 bg-slate-100 text-slate-400 font-semibold rounded-lg text-sm cursor-not-allowed border border-slate-200">
                                        Cannot be changed
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-4">
                                <div className="p-3 bg-white rounded-lg shadow-sm text-primary">
                                    <Lock size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-slate-900">Password</h3>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Secure your account with a strong password. We recommend changing it periodically.
                                    </p>
                                    <button
                                        onClick={() => setIsPasswordModalOpen(true)}
                                        className="mt-4 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg text-sm hover:bg-slate-50 transition-colors shadow-sm"
                                    >
                                        Change Password
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-4">
                                <div className="p-3 bg-white rounded-lg shadow-sm text-emerald-600">
                                    <Shield size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-slate-900">Two-Factor Authentication</h3>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Add an extra layer of security to your account. (Coming Soon)
                                    </p>
                                    <button disabled className="mt-4 px-4 py-2 bg-slate-100 text-slate-400 font-semibold rounded-lg text-sm cursor-not-allowed">
                                        Enable 2FA
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </ProfileHeader>

            <PasswordChangeModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />
        </div>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        }>
            <ProfileContent />
        </Suspense>
    );
}
