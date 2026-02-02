'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus('idle');

        try {
            await api.post('/forgot-password', { email });
            setStatus('success');
            setMessage('We have emailed your password reset link.');
        } catch (err: any) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'We could not find a user with that email address.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Forgot Password?"
            subtitle="No worries, we'll send you reset instructions."
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {status !== 'idle' && (
                    <Alert type={status === 'success' ? 'success' : 'error'}>{message}</Alert>
                )}

                <div className="space-y-4">
                    <Input
                        label="Email"
                        type="email"
                        placeholder="name@example.com"
                        icon={Mail}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                    />
                </div>

                <Button
                    type="submit"
                    fullWidth
                    variant="primary"
                    isLoading={isLoading}
                >
                    Send Reset Link
                </Button>

                <div className="text-center">
                    <Link href="/login" className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to log in
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
}
