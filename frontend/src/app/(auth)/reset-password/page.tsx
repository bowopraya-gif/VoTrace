'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, CheckCircle2, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { PasswordRequirements } from '@/components/auth/PasswordRequirements';

type ValidationState = 'default' | 'success' | 'error';

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    const [formData, setFormData] = useState({
        password: '',
        password_confirmation: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [confirmPasswordStatus, setConfirmPasswordStatus] = useState<ValidationState>('default');

    // Check if passwords match
    useEffect(() => {
        if (!formData.password_confirmation) {
            setConfirmPasswordStatus('default');
            return;
        }

        if (formData.password === formData.password_confirmation) {
            setConfirmPasswordStatus('success');
        } else {
            setConfirmPasswordStatus('error');
        }
    }, [formData.password, formData.password_confirmation]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (formData.password !== formData.password_confirmation) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            await api.post('/reset-password', {
                token,
                email,
                password: formData.password,
                password_confirmation: formData.password_confirmation,
            });
            router.push('/login?reset=success');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password.');
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <AuthLayout
            title="Reset password"
            subtitle="Choose a new strong password for your account"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <Alert type="error">{error}</Alert>
                )}

                <div className="space-y-4">
                    <div>
                        <Input
                            label="New Password"
                            type="password"
                            placeholder="••••••••"
                            icon={Lock}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            autoFocus
                        />
                        {formData.password && (
                            <div className="mt-3 space-y-3">
                                <PasswordStrengthMeter password={formData.password} />
                                <PasswordRequirements password={formData.password} />
                            </div>
                        )}
                    </div>

                    <div>
                        <Input
                            label="Confirm Password"
                            type="password"
                            placeholder="••••••••"
                            icon={Lock}
                            value={formData.password_confirmation}
                            onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                            required
                            validationState={confirmPasswordStatus}
                            showValidationIcon={!!formData.password_confirmation}
                            error={confirmPasswordStatus === 'error' ? 'Passwords do not match' : undefined}
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    fullWidth
                    variant="primary"
                    isLoading={isLoading}
                >
                    Reset Password
                </Button>
            </form>
        </AuthLayout>
    );
}
