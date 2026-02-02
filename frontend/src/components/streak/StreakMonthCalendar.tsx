"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { StreakActivity } from '@/types/streak';
import { useAuthStore } from '@/stores/authStore'; // Import Auth Store
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    isSameMonth,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    isFuture,
    isBefore
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function StreakMonthCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activities, setActivities] = useState<StreakActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore(); // Get user for created_at

    // Fetch data when month changes
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch full year for smooth navigation logic
                const year = currentDate.getFullYear();
                const res = await api.get(`/streak/calendar?year=${year}`);
                setActivities(res.data);
            } catch (error) {
                console.error("Failed to fetch calendar", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentDate.getFullYear()]);

    // Navigation Limits
    const accountCreatedDate = user?.created_at ? new Date(user.created_at) : new Date(0); // Default to epoch if missing

    // Normalize to start of month for comparison
    const minMonth = startOfMonth(accountCreatedDate);
    const maxMonth = startOfMonth(new Date()); // Current month

    const nextMonth = () => {
        const next = addMonths(currentDate, 1);
        if (!isFuture(startOfMonth(next))) {
            setCurrentDate(next);
        }
    };

    const prevMonth = () => {
        const prev = subMonths(currentDate, 1);
        // Allow if prev month is NOT before minMonth
        if (!isBefore(startOfMonth(prev), minMonth)) {
            setCurrentDate(prev);
        }
    };

    // Calculate disabled states
    const isPrevDisabled = isBefore(startOfMonth(subMonths(currentDate, 1)), minMonth);
    const isNextDisabled = isFuture(startOfMonth(addMonths(currentDate, 1)));

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const hasActivityInMonth = activities.some(a => isSameMonth(new Date(a.activity_date), currentDate));
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-white p-6 md:p-8 rounded-[24px] border border-slate-100 shadow-sm relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-800">
                    {format(currentDate, 'MMMM yyyy')}
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={prevMonth}
                        disabled={isPrevDisabled}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={nextMonth}
                        disabled={isNextDisabled}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 mb-4">
                {weekDays.map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider py-2">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-y-4 gap-x-2">
                {calendarDays.map((day) => {
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const activity = activities.find(a => isSameDay(new Date(a.activity_date), day));
                    const isToday = isSameDay(day, new Date());

                    const count = activity ? activity.vocabulary_count : 0;
                    const isActive = count > 0;

                    return (
                        <div
                            key={day.toISOString()}
                            className={`
                                flex flex-col items-center justify-center min-h-[50px] relative group cursor-default
                                ${!isCurrentMonth ? 'opacity-30' : ''}
                            `}
                        >
                            <div className={`
                                w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium transition-all
                                ${isActive ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-md shadow-orange-200' : 'text-slate-600 hover:bg-slate-50'}
                                ${isToday && !isActive ? 'ring-2 ring-blue-400 text-blue-600 font-bold' : ''}
                            `}>
                                {format(day, 'd')}
                            </div>

                            {/* Dot indicator for count */}
                            {isActive && (
                                <div className="mt-1 text-[10px] font-bold text-orange-600">
                                    {count > 1 ? `+${count}` : '•'}
                                </div>
                            )}

                            {/* Tooltip for Vocabulary Count */}
                            {isActive && (
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                                    {count} words added
                                    {/* Arrow */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {!hasActivityInMonth && !loading && (
                <div className="mt-6 text-center text-sm text-slate-400 italic">
                    No learning activity recorded this month.
                </div>
            )}
        </div>
    );
}
