import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export const AuthLayout = ({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle: React.ReactNode }) => {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuthStore();

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return null; // or a loading spinner
    }

    if (isAuthenticated) {
        return null; // Prevent flash of content while redirecting
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Branding Section */}
            <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-white">
                <div>
                    <div className="flex items-center gap-3">
                        {/* Simple Logo Placeholder */}
                        <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xl">
                            V
                        </div>
                        <span className="text-2xl font-bold tracking-tight">VoTrace</span>
                    </div>
                    <div className="mt-20 max-w-md">
                        <h1 className="text-4xl font-bold leading-tight">
                            Master English Vocabulary, <br /> One Word at a Time.
                        </h1>
                        <p className="mt-6 text-lg text-primary-50 text-opacity-90">
                            Join thousands of learners building their vocabulary streak with AI-powered tools and smart tracking.
                        </p>
                    </div>
                </div>

                <div className="text-sm text-primary-50 text-opacity-70">
                    © {new Date().getFullYear()} VoTrace. All rights reserved.
                </div>
            </div>

            {/* Form Section */}
            <div className="flex items-center justify-center p-8 bg-neutral-50">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">{title}</h2>
                        <p className="mt-2 text-sm text-neutral-600">
                            {subtitle}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};
