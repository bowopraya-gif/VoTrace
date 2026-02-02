'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
    src: string;
    autoPlay?: boolean;
    onEnded?: () => void;
    disabled?: boolean;
}

const SPEEDS = [0.5, 0.75, 1] as const;
type Speed = typeof SPEEDS[number];

export default function AudioPlayer({ src, autoPlay = true, onEnded, disabled = false }: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [speed, setSpeed] = useState<Speed>(1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasPlayed, setHasPlayed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    // Apply speed with pitch preservation
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = speed;
            // Critical: Maintain natural voice at slow speeds
            audioRef.current.preservesPitch = true;
        }
    }, [speed]);

    // URL Handling: If src is relative (starts with /), prepend backend base URL
    const getFullUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        // Hardcoded for now based on api.ts or env. Ideally use env var VITE_BACKEND_URL
        const baseUrl = 'http://localhost:8000';
        return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const audioSrc = getFullUrl(src);

    // Reset state when src changes (new question)
    useEffect(() => {
        setHasPlayed(false);
        setIsPlaying(false);
        setIsLoading(true);
        setError(false);
    }, [src]);

    // Auto-play when audio is ready
    const handleCanPlay = useCallback(() => {
        setIsLoading(false);
        if (autoPlay && !disabled && audioRef.current) {
            audioRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                    setHasPlayed(true);
                })
                .catch((e) => {
                    console.warn('Autoplay blocked:', e.message);
                    // Autoplay blocked by browser - user will need to click play
                });
        }
    }, [autoPlay, disabled]);

    const handleError = () => {
        setIsLoading(false);
        setError(true);
    };

    const handlePlayPause = () => {
        if (!audioRef.current || disabled) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play()
                .then(() => {
                    setHasPlayed(true);
                })
                .catch(() => { });
        }
    };

    const handleReplay = () => {
        if (audioRef.current && !disabled) {
            audioRef.current.currentTime = 0;
            audioRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                })
                .catch(() => { });
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        onEnded?.();
    };

    if (error) {
        return (
            <div className="flex items-center justify-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-500">
                <Volume2 size={24} className="opacity-50" />
                <span className="text-sm font-medium">Audio unavailable</span>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <audio
                ref={audioRef}
                src={audioSrc}
                onCanPlayThrough={handleCanPlay}
                onError={handleError}
                onEnded={handleEnded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                preload="auto"
            />

            {/* Play/Pause Button */}
            <button
                onClick={handlePlayPause}
                disabled={isLoading || disabled}
                className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all",
                    isLoading
                        ? "bg-slate-200 text-slate-400 cursor-wait"
                        : disabled
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-primary text-white shadow-primary/30 hover:bg-primary/90"
                )}
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                    <Pause size={24} />
                ) : (
                    <Play size={24} className="ml-1" />
                )}
            </button>

            {/* Replay Button */}
            {hasPlayed && !isLoading && (
                <button
                    onClick={handleReplay}
                    disabled={disabled}
                    className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        disabled
                            ? "bg-slate-100 text-slate-300"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    )}
                >
                    <RotateCcw size={18} />
                </button>
            )}

            {/* Speed Controls */}
            <div className="flex gap-1 bg-white rounded-lg p-1 border border-slate-200">
                {SPEEDS.map((s) => (
                    <button
                        key={s}
                        onClick={() => setSpeed(s)}
                        disabled={disabled}
                        className={cn(
                            "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                            speed === s
                                ? "bg-primary text-white"
                                : disabled
                                    ? "text-slate-300"
                                    : "text-slate-500 hover:bg-slate-100"
                        )}
                    >
                        {s}x
                    </button>
                ))}
            </div>
        </div>
    );
}
