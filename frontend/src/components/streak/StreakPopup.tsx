"use client";

import { useEffect, useState } from 'react';
import { useStreakStore } from '@/stores/streakStore';
import { Flame, X } from 'lucide-react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

export default function StreakPopup() {
    const { status, markPopupShown } = useStreakStore();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (status) {
            const lastShown = localStorage.getItem('streak_popup_date');
            const today = new Date().toDateString();

            // Show if not shown today
            if (lastShown !== today) {
                const timer = setTimeout(() => setIsOpen(true), 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [status]);

    const handleClose = () => {
        setIsOpen(false);
        markPopupShown();
    };

    if (!status) return null;

    // determine message
    let message = "Start your learning journey!";
    if (status.current_streak > 0) {
        if (status.current_streak >= 30) message = "You're unstoppable! 30 days on fire! 🔥";
        else if (status.current_streak >= 7) message = "Keep it up! One week strong! 💪";
        else if (status.added_today) message = "Great job today! Streak extended.";
        else message = "Don't break the chain! Add a word today.";
    } else if (status.longest_streak > 0) {
        message = "Let's beat your record of " + status.longest_streak + " days!";
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Streak Popup"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-sm rounded-[20px] p-[30px] overflow-hidden text-center text-white"
                        style={{
                            background: 'linear-gradient(135deg, #ff6b35, #ffa62e)',
                            boxShadow: '0 20px 60px rgba(255, 107, 53, 0.3)'
                        }}
                    >
                        {/* Radial Background Effect */}
                        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] pointer-events-none"
                            style={{
                                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 70%)',
                                zIndex: 0
                            }}
                        ></div>

                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-1 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10 z-10"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>

                        <div className="relative z-10">
                            {/* Streak Count */}
                            <div className="flex flex-col items-center justify-center mb-4">
                                <div className="text-7xl font-black text-white drop-shadow-md leading-none">
                                    {status.current_streak}
                                </div>
                                <div className="text-sm font-medium text-white/80 uppercase tracking-widest mt-2">
                                    Days Streak
                                </div>
                            </div>

                            {/* Longest Streak */}
                            <div className="text-sm text-white/90 mb-6 flex items-center justify-center gap-2 bg-white/10 py-1 px-3 rounded-full mx-auto w-fit">
                                <span>Longest streak:</span>
                                <span className="font-bold">{status.longest_streak} days</span>
                            </div>

                            {/* Message */}
                            <p className="text-white font-medium mb-8 px-2 text-lg leading-relaxed shadow-sm">
                                {message}
                            </p>

                            {/* Buttons */}
                            <div className="flex flex-col gap-3">
                                <Link
                                    href="/statistics"
                                    onClick={handleClose}
                                    className="w-full py-3 px-4 bg-transparent border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                >
                                    View Details
                                </Link>
                                <button
                                    onClick={handleClose}
                                    className="w-full py-3 px-4 bg-white text-[#ff6b35] font-bold rounded-xl shadow-lg hover:bg-gray-50 hover:scale-[1.02] transition-all active:scale-95"
                                >
                                    Keep Learning
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
