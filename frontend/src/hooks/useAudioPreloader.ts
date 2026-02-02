'use client';

import { useEffect, useRef } from 'react';

interface Question {
    audio_url?: string;
}

/**
 * Preloads audio for upcoming questions to ensure zero-latency transitions
 * Uses both <link rel="preload"> and fetch() for browser cache priming
 */
export function useAudioPreloader(questions: Question[], currentIndex: number) {
    const preloadedRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        // Preload next 2 questions' audio
        const preloadCount = 2;

        for (let i = 1; i <= preloadCount; i++) {
            const nextIndex = currentIndex + i;
            if (nextIndex < questions.length) {
                const nextAudioUrl = questions[nextIndex]?.audio_url;

                if (nextAudioUrl && !preloadedRef.current.has(nextAudioUrl)) {
                    // Method 1: Link preload for browser-level cache hint
                    const link = document.createElement('link');
                    link.rel = 'preload';
                    link.as = 'audio';
                    link.href = nextAudioUrl;
                    link.crossOrigin = 'anonymous';
                    document.head.appendChild(link);

                    // Method 2: Fetch to ensure data is actually cached
                    fetch(nextAudioUrl, {
                        mode: 'cors',
                        credentials: 'omit'
                    })
                        .then(() => {
                            preloadedRef.current.add(nextAudioUrl);
                        })
                        .catch(() => {
                            // Silent fail for preload - audio will load when needed
                        });

                    // Mark as initiated (not necessarily complete)
                    preloadedRef.current.add(nextAudioUrl);
                }
            }
        }

        // Cleanup: Remove preload links when component unmounts
        return () => {
            const links = document.querySelectorAll('link[rel="preload"][as="audio"]');
            links.forEach(link => link.remove());
        };
    }, [currentIndex, questions]);
}
