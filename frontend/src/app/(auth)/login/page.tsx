'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [formData, setFormData] = useState({
        login: '',
        password: '',
        remember: false,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [lockoutSeconds, setLockoutSeconds] = useState(0);

    // Countdown timer for lockout
    useEffect(() => {
        if (lockoutSeconds > 0) {
            const timer = setTimeout(() => setLockoutSeconds(lockoutSeconds - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [lockoutSeconds]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (lockoutSeconds > 0) return;

        setIsLoading(true);
        setError('');

        try {
            await login(formData);
            router.push('/dashboard');
        } catch (err: any) {
            if (err.requires_verification) {
                router.push(`/verify-email?email=${encodeURIComponent(err.email)}`);
                return;
            }

            // Handle 429 or 422 with rate limit message
            if (err.response?.status === 429 || err.response?.status === 422) {
                const message = err.response?.data?.message || err.response?.data?.errors?.login?.[0];
                if (message?.includes('Too many') || err.response?.status === 429) {
                    const match = message?.match(/(\d+)\s*seconds/);
                    const seconds = match ? parseInt(match[1]) : 60;
                    setLockoutSeconds(seconds);
                    setError(`Too many login attempts. Please wait...`);
                    return;
                }
            }

            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Welcome back"
            subtitle={
                <>
                    Don't have an account?{' '}
                    <Link href="/register" className="text-primary hover:underline font-medium">
                        Sign up
                    </Link>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <Alert type="error">
                        {error}
                        {lockoutSeconds > 0 && (
                            <div className="mt-1 font-mono text-sm">
                                Try again in: {formatTime(lockoutSeconds)}
                            </div>
                        )}
                    </Alert>
                )}

                <div className="space-y-4">
                    <Input
                        label="Email or Username"
                        type="text"
                        placeholder="Enter email or username"
                        icon={User}
                        value={formData.login}
                        onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                        required
                        autoFocus
                        disabled={lockoutSeconds > 0}
                    />

                    <div className="space-y-1">
                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            icon={Lock}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            disabled={lockoutSeconds > 0}
                        />
                        <div className="flex items-center justify-between mt-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={formData.remember}
                                        onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
                                        disabled={lockoutSeconds > 0}
                                    />
                                    <div className="w-4 h-4 border border-gray-300 rounded bg-white peer-checked:bg-primary peer-checked:border-primary transition-colors"></div>
                                    <svg className="absolute w-3 h-3 text-white left-0.5 top-0.5 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Remember me for 30 days</span>
                            </label>

                            <Link
                                href="/forgot-password"
                                className="text-sm text-primary hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>
                    </div>
                </div>

                <Button
                    type="submit"
                    fullWidth
                    variant="primary"
                    isLoading={isLoading}
                    disabled={lockoutSeconds > 0}
                >
                    {lockoutSeconds > 0 ? `Locked (${formatTime(lockoutSeconds)})` : 'Sign in'}
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

                {/* Google Login */}
                <GoogleLoginButton />
            </form>
        </AuthLayout>
    );
}
