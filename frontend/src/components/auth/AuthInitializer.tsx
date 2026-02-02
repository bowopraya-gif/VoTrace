'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function AuthInitializer() {
    const { fetchUser } = useAuthStore();
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            fetchUser();
        }
    }, [fetchUser]);

    return null;
}
