'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Calendar } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { useDebounce } from '@/hooks/useDebounce';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { PasswordRequirements } from '@/components/auth/PasswordRequirements';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import api from '@/lib/api';

type ValidationState = 'default' | 'loading' | 'success' | 'error';

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuthStore();

    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        email: '',
        date_of_birth: '',
        password: '',
        password_confirmation: '',
    });

    // Validation States
    const [usernameStatus, setUsernameStatus] = useState<ValidationState>('default');
    const [emailStatus, setEmailStatus] = useState<ValidationState>('default');
    const [confirmPasswordStatus, setConfirmPasswordStatus] = useState<ValidationState>('default');

    // Custom Errors (for availability)
    const [usernameError, setUsernameError] = useState('');
    const [emailError, setEmailError] = useState('');

    const debouncedUsername = useDebounce(formData.username, 500);
    const debouncedEmail = useDebounce(formData.email, 500);

    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState('');

    // Check Username Availability
    useEffect(() => {
        const checkUsername = async () => {
            if (debouncedUsername.length < 3) {
                setUsernameStatus('default');
                setUsernameError('');
                return;
            }

            // Basic regex check before API
            if (!/^[a-zA-Z0-9_]+$/.test(debouncedUsername)) {
                setUsernameStatus('error');
                setUsernameError('Username can only contain letters, numbers, and underscores');
                return;
            }

            setUsernameStatus('loading');
            try {
                const res = await api.post('/check-username', { username: debouncedUsername });
                if (res.data.available) {
                    setUsernameStatus('success');
                    setUsernameError('');
                } else {
                    setUsernameStatus('error');
                    setUsernameError('Username is already taken');
                }
            } catch (err) {
                setUsernameStatus('default'); // fallback
            }
        };

        if (debouncedUsername) checkUsername();
        else setUsernameStatus('default');

    }, [debouncedUsername]);

    // Check Email Availability
    useEffect(() => {
        const checkEmail = async () => {
            if (!debouncedEmail || !debouncedEmail.includes('@')) {
                setEmailStatus('default');
                setEmailError('');
                return;
            }

            setEmailStatus('loading');
            try {
                const res = await api.post('/check-email', { email: debouncedEmail });
                if (res.data.available) {
                    setEmailStatus('success');
                } else {
                    setEmailStatus('error');
                    setEmailError('Email is already registered');
                }
            } catch (err) {
                setEmailStatus('default');
            }
        };
        if (debouncedEmail) checkEmail();
        else setEmailStatus('default');

    }, [debouncedEmail]);

    // Check Confirm Password
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
        setFormError('');

        // Block if validation errors exist
        if (usernameStatus === 'error' || emailStatus === 'error' || confirmPasswordStatus === 'error') {
            setFormError('Please fix the errors in the form before submitting.');
            setIsLoading(false);
            return;
        }

        try {
            await register(formData);
            router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Registration failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Create an account"
            subtitle={
                <>
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary hover:underline font-medium">
                        Sign in
                    </Link>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                    <Alert type="error">{formError}</Alert>
                )}

                <Input
                    label="Full Name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                />

                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Username"
                        type="text"
                        placeholder="johndoe"
                        icon={User}
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                        validationState={usernameStatus}
                        error={usernameError}
                    />

                    <Input
                        label="Date of Birth"
                        type="date"
                        icon={Calendar}
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        required
                    />
                </div>

                <Input
                    label="Email"
                    type="email"
                    placeholder="name@example.com"
                    icon={Mail}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    validationState={emailStatus}
                    error={emailError}
                />

                <div>
                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        icon={Lock}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                    {/* Real-time Password Strength Meter and Requirements */}
                    <PasswordStrengthMeter password={formData.password} />
                    <PasswordRequirements password={formData.password} />
                </div>

                <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Confirm your password"
                    icon={Lock}
                    value={formData.password_confirmation}
                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                    required
                    validationState={confirmPasswordStatus}
                    showValidationIcon={!!formData.password_confirmation}
                />

                <Button
                    type="submit"
                    fullWidth
                    variant="primary"
                    isLoading={isLoading}
                    className="mt-2"
                >
                    Create account
                </Button>

                {/* Divider */}
                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-neutral-300" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-neutral-50 px-2 text-neutral-500">Or continue with</span>
                    </div>
                </div>

                {/* Google Signup */}
                <GoogleLoginButton text="Sign up with Google" />
            </form>
        </AuthLayout>
    );
}
