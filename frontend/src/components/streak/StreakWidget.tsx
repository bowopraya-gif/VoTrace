"use client";

import { useEffect, useState } from 'react';
import { useStreakStore } from '@/stores/streakStore';
import Link from 'next/link';
import './streak-widget.css';

export default function StreakWidget() {
    const { status, fetchStatus, isLoading } = useStreakStore();
    const [mounted, setMounted] = useState(false);
    const [bump, setBump] = useState(false);
    const [prevStreak, setPrevStreak] = useState(0);

    useEffect(() => {
        setMounted(true);
        fetchStatus();
    }, [fetchStatus]);

    useEffect(() => {
        if (status?.current_streak && status.current_streak > prevStreak) {
            setBump(true);
            const timer = setTimeout(() => setBump(false), 300);
            return () => clearTimeout(timer);
        }
        if (status?.current_streak) {
            setPrevStreak(status.current_streak);
        }
    }, [status?.current_streak, prevStreak]);

    if (!mounted || isLoading || !status) return null;

    // Logic Translation from Script
    const currentStreak = status.current_streak;
    const studiedToday = status.added_today;

    // Determine Logic State based on user script
    let state: 'no_streak' | 'active' | 'frozen_active' = 'no_streak';

    if (currentStreak === 0) {
        state = 'no_streak';
    } else if (studiedToday) {
        state = 'active';
    } else {
        // API BEKU - Belum belajar hari ini, tapi streak masih berjalan
        state = 'frozen_active';
    }

    // Prepare UI Classes based on state
    // Fire color & text
    let fireClass = '';
    let badgeClass = '';
    let miniFireClass = '';

    if (state === 'no_streak') {
        fireClass = 'frozen'; // Grey, frozen animation
        badgeClass = 'frozen';
        miniFireClass = 'frozen';
    } else if (state === 'active') {
        fireClass = 'active'; // Orange, glowing
        badgeClass = 'active';
        miniFireClass = ''; // Normal orange
    } else if (state === 'frozen_active') {
        fireClass = 'frozen'; // Grey, frozen animation (but badge has number)
        badgeClass = 'frozen';
        miniFireClass = 'frozen';
    }

    // Tooltip Content Logic
    let tooltipMessage = '';
    let statusIndicator = null;
    let todayStatusIcon = '';
    let todayStatusTitle = '';

    if (studiedToday) {
        todayStatusIcon = '✅';
        todayStatusTitle = 'Learned today';
    } else {
        todayStatusIcon = '❌';
        todayStatusTitle = 'Not learned yet';
    }

    switch (state) {
        case 'active':
            tooltipMessage = `🔥 ${currentStreak}-day streak active! You've learned today.`;
            statusIndicator = <span className="status-active">✅ Streak active</span>;
            break;
        case 'frozen_active':
            tooltipMessage = `❄️ ${currentStreak}-day streak running! Don't forget to learn today to keep it.`;
            statusIndicator = <span className="status-frozen">❄️ Not learned yet</span>;
            break;
        case 'no_streak':
        default:
            tooltipMessage = '❄️ Start your learning streak today! Learn every day to light the fire.';
            statusIndicator = <span className="status-frozen">❄️ No streak yet</span>;
            break;
    }

    return (
        <div className="streak-widget-container" aria-hidden="true">
            <Link href="/streak">
                <div className="streak-widget">
                    {/* Main Fire */}
                    <div className="streak-fire-main">
                        <div className={`streak-fire-icon ${fireClass}`}>
                            🔥
                        </div>

                        {/* Mini Fires */}
                        <div className="mini-fires" aria-hidden="true">
                            <div className={`mini-fire ${miniFireClass}`}>🔥</div>
                            <div className={`mini-fire ${miniFireClass}`}>🔥</div>
                            <div className={`mini-fire ${miniFireClass}`}>🔥</div>
                        </div>

                        {/* Count Badge */}
                        <div className={`streak-count-badge ${badgeClass} ${bump ? 'bump-anim' : ''}`}>
                            {currentStreak}
                        </div>
                    </div>

                    {/* Tooltip */}
                    <div className="streak-widget-tooltip" aria-hidden="true">
                        <div className="streak-tooltip-header">
                            <h4>Learning Streak</h4>
                        </div>
                        <div className="streak-tooltip-content">
                            <p>{tooltipMessage}</p>
                            <div className="streak-status-indicator">
                                {statusIndicator}
                            </div>
                        </div>
                        <div className="streak-tooltip-stats">
                            <div className="streak-stat-item">
                                <div className="streak-stat-value" style={{ color: '#1f2937' }}>
                                    {currentStreak}
                                </div>
                                <div className="streak-stat-label">Current</div>
                            </div>
                            <div className="streak-stat-item">
                                <div className="streak-stat-value" style={{ color: '#1f2937' }}>
                                    {status.longest_streak}
                                </div>
                                <div className="streak-stat-label">Longest</div>
                            </div>
                            <div className="streak-stat-item">
                                <div className="streak-stat-value" style={{ color: '#1f2937' }}>
                                    <span title={todayStatusTitle}>{todayStatusIcon}</span>
                                </div>
                                <div className="streak-stat-label">Today</div>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}
