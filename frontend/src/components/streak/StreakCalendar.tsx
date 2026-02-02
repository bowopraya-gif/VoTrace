"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { StreakActivity } from '@/types/streak';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';

export default function StreakCalendar() {
    const [activities, setActivities] = useState<StreakActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCalendar = async () => {
            try {
                const res = await api.get('/streak/calendar');
                setActivities(res.data);
            } catch (error) {
                console.error("Failed to fetch calendar", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCalendar();
    }, []);

    // Generate last 90 days
    const today = new Date();
    const startDate = subDays(today, 90); // approx 3 months
    const days = eachDayOfInterval({ start: startDate, end: today });

    // Helper to get color intensity
    const getColor = (count: number) => {
        if (count === 0) return 'bg-slate-100';
        if (count <= 2) return 'bg-orange-200';
        if (count <= 5) return 'bg-orange-300';
        if (count <= 10) return 'bg-orange-400';
        return 'bg-orange-500';
    };

    if (isLoading) return <div className="h-48 animate-pulse bg-slate-100 rounded-2xl"></div>;

    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Activity History</h3>

            {/* Visual Heatmap Grid */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {days.map((day) => {
                    const activity = activities.find(a => isSameDay(new Date(a.activity_date), day));
                    const count = activity ? activity.vocabulary_count : 0;

                    return (
                        <div
                            key={day.toISOString()}
                            className={`w-4 h-4 md:w-5 md:h-5 rounded-md ${getColor(count)} transition-all hover:scale-125 hover:ring-2 ring-offset-1 ring-orange-200 cursor-default relative group`}
                        >
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 min-w-max px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                {format(day, 'MMM d, yyyy')}: {count} words
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center gap-4 mt-6 text-xs text-slate-500 justify-end">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className="w-4 h-4 rounded bg-slate-100"></div>
                    <div className="w-4 h-4 rounded bg-orange-200"></div>
                    <div className="w-4 h-4 rounded bg-orange-300"></div>
                    <div className="w-4 h-4 rounded bg-orange-400"></div>
                    <div className="w-4 h-4 rounded bg-orange-500"></div>
                </div>
                <span>More</span>
            </div>
        </div>
    );
}
