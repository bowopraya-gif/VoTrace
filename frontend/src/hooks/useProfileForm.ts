'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { UserProfile, ProfileUpdatePayload, UsernameCheckResponse } from '@/types/profile';

export function useProfileForm(initialProfile: UserProfile | null) {
    const [formData, setFormData] = useState<ProfileUpdatePayload>({});
    const [originalData, setOriginalData] = useState<ProfileUpdatePayload>({});
    const [isDirty, setIsDirty] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    // Username availability
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

    // Initialize form data from profile
    useEffect(() => {
        if (initialProfile) {
            // Map legacy levels to CEFR standard
            const mapLevel = (level: string | undefined | null) => {
                if (!level) return 'A1';

                // Normalize: Trim and Uppercase
                const straight = level.toString().trim().toUpperCase();

                // 1. Direct CEFR Match
                if (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(straight)) {
                    return straight;
                }

                // 2. Legacy/Map Match
                const map: Record<string, string> = {
                    'BEGINNER': 'A1',
                    'ELEMENTARY': 'A2',
                    'INTERMEDIATE': 'B1',
                    'ADVANCED': 'C1',
                    'PROFICIENT': 'C2'
                };
                return map[straight] || 'A1';
            };

            const data = {
                full_name: initialProfile.full_name || '',
                username: initialProfile.username,
                date_of_birth: initialProfile.date_of_birth || '',
                english_level: mapLevel(initialProfile.english_level) as any,
            };
            setFormData(data);
            setOriginalData(data);
        }
    }, [initialProfile]);

    // Dirty state detection
    useEffect(() => {
        const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData) || avatarFile !== null;
        setIsDirty(hasChanges);
    }, [formData, originalData, avatarFile]);

    // Update field
    const updateField = useCallback((field: keyof ProfileUpdatePayload, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // Check username availability (debounced call from component)
    const checkUsername = useCallback(async (username: string): Promise<UsernameCheckResponse | null> => {
        if (!username || username === originalData.username) {
            setUsernameStatus('idle');
            return null;
        }

        setUsernameStatus('checking');
        try {
            const res = await api.get('/profile/check-username', { params: { username } });
            setUsernameStatus(res.data.available ? 'available' : 'taken');
            return res.data;
        } catch {
            setUsernameStatus('idle');
            return null;
        }
    }, [originalData.username]);

    // Handle avatar selection (preview only, no upload yet)
    const handleAvatarChange = useCallback((file: File | null) => {
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        } else {
            setAvatarFile(null);
            setAvatarPreview(null);
        }
    }, []);

    // Save profile
    const saveProfile = useCallback(async (): Promise<boolean> => {
        setIsSaving(true);
        try {
            // 1. Upload avatar first if changed
            if (avatarFile) {
                const formDataAvatar = new FormData();
                formDataAvatar.append('avatar', avatarFile);
                await api.post('/profile/avatar', formDataAvatar, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            // 2. Update profile data
            await api.put('/profile', formData);

            // Reset states
            setOriginalData(formData);
            setAvatarFile(null);
            setAvatarPreview(null);
            setIsDirty(false);
            setIsEditing(false);

            return true;
        } catch (error) {
            console.error('Failed to save profile', error);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [formData, avatarFile]);

    // Cancel editing
    const cancelEdit = useCallback(() => {
        setFormData(originalData);
        setAvatarFile(null);
        setAvatarPreview(null);
        setIsEditing(false);
        setUsernameStatus('idle');
    }, [originalData]);

    // Enter edit mode
    const startEditing = useCallback(() => {
        setIsEditing(true);
    }, []);

    return {
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
        checkUsername,
    };
}
