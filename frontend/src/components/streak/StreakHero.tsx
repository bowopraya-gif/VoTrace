"use client";

import { motion } from 'framer-motion';
import { StreakStatus } from '@/types/streak';
import './streak-widget.css';

interface StreakHeroProps {
    status: StreakStatus;
}

export default function StreakHero({ status }: StreakHeroProps) {
    const { added_today, current_streak } = status;

    // Determine State 
    let state: 'no_streak' | 'active' | 'frozen_active' = 'no_streak';
    if (current_streak === 0) state = 'no_streak';
    else if (added_today) state = 'active';
    else state = 'frozen_active';

    // Visual Config
    let fireVisualClass = '';
    let textColor = '';
    let message = '';
    let subMessage = '';

    if (state === 'active') {
        fireVisualClass = 'active'; // Orange, glowing animation from CSS
        textColor = 'text-white'; // White text usually looks best inside orange fire, or orange text if overlay

        if (current_streak >= 100) {
            message = "Unstoppable!";
            subMessage = "You've reached a legendary milestone.";
        } else if (current_streak >= 30) {
            message = "You're on fire!";
            subMessage = "30 days of consistent learning!";
        } else if (current_streak >= 7) {
            message = "Week streak! Keep it up!";
            subMessage = "You're building a solid habit.";
        } else {
            message = "Streak Extended!";
            subMessage = "Great job learning today.";
        }

    } else if (state === 'frozen_active') {
        fireVisualClass = 'frozen';
        textColor = 'text-slate-200';
        message = "Streak Frozen";
        subMessage = "Learn today to keep your streak alive!";
    } else {
        fireVisualClass = 'frozen';
        textColor = 'text-slate-300';
        message = "Start a Streak";
        subMessage = "Learn every day to build your streak.";
    }

    return (
        <div className="flex flex-col items-center justify-center text-center py-16 select-none pointer-events-none">

            <div className="relative z-10 flex flex-col items-center justify-center">

                {/* 
                    Unified Container for Fire and Number. 
                    We apply the 'streak-fire-icon' class-like behavior here to sync them?
                    Actually, stick to the plan: Make them overlap perfectly and animate together.
                */}
                <div className="relative w-80 h-80 flex items-center justify-center">

                    {/* The Fire & Number Wrapper - Responsive Scale */}
                    <div className="streak-fire-main w-full h-full flex items-center justify-center transform scale-[1.3] sm:scale-150 md:scale-[2.0] origin-center">

                        {/* Container that holds both to ensuring exact same movement if we applied transform to parent. 
                            But the CSS 'active' class applies animation to the ELEMENT. 
                            So we apply the class to specific elements OR wrap them.
                            Let's wrap them in a div that HAS the animation class so they distort together.
                        */}
                        <div className={`streak-fire-icon ${fireVisualClass} relative flex items-center justify-center`}>
                            {/* The Emoji */}
                            <span className="text-[10rem] leading-none filter-none">🔥</span>

                            {/* The Number - Absolute Center overlay */}
                            <span
                                className={`
                                    absolute bottom-[10%] left-1/2 -translate-x-1/2 
                                    text-[2.5rem] font-black ${textColor}
                                    leading-none tracking-tighter
                                `}
                            >
                                {current_streak}
                            </span>
                        </div>

                    </div>
                </div>

                {/* Motivational Text - Pointer events allowed here? */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-12 max-w-lg pointer-events-auto"
                >
                    <h2 className={`text-4xl font-black ${state === 'active' ? 'text-slate-800' : 'text-slate-500'} mb-3`}>
                        {message}
                    </h2>
                    <p className="text-slate-500 font-medium text-xl">
                        {subMessage}
                    </p>
                </motion.div>

            </div>
        </div>
    );
}
