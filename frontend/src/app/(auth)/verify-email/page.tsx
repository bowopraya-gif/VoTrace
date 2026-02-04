'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import api from '@/lib/api';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const emailParam = searchParams.get('email') || '';

    const { verifyEmail } = useAuthStore();

    const [otp, setOtp] = useState('');
    const [email, setEmail] = useState(emailParam);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [emailParam]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setStatus('error');
            setMessage('Please enter a valid 6-digit code.');
            return;
        }

        setIsLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            await verifyEmail({ email, otp });
            setStatus('success');
            setMessage('Your email has been verified successfully!');
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (err: any) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Verification failed. Invalid or expired code.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            await api.post('/email/resend', { email });
            alert('Verification code resent to your email.');
        } catch (err) {
            alert('Failed to resend code.');
        }
    };

    return (
        <AuthLayout
            title="Verify your email"
            subtitle={`We've sent a 6-digit code to ${email}`}
        >
            {status === 'success' ? (
                <div className="text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="bg-green-100 p-4 rounded-full">
                            <CheckCircle className="h-12 w-12 text-success" />
                        </div>
                    </div>
                    <h3 className="text-xl font-medium text-neutral-900">Verified!</h3>
                    <p className="text-neutral-600">Redirecting to dashboard...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {status === 'error' && (
                        <Alert type="error">{message}</Alert>
                    )}

                    {!emailParam && (
                        <Input
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700 block">
                            Verification Code
                        </label>
                        <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full text-center text-3xl tracking-[1em] font-bold py-3 rounded-lg border border-neutral-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            placeholder="000000"
                            required
                        />
                        <p className="text-xs text-neutral-500 text-center">
                            Enter the 6-digit code sent to your email
                        </p>
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        variant="primary"
                        isLoading={isLoading}
                        disabled={otp.length !== 6}
                    >
                        Verify Email
                    </Button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={handleResend}
                            className="text-sm text-primary hover:underline"
                        >
                            Resend Code
                        </button>
                    </div>
                </form>
            )}
        </AuthLayout>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}

