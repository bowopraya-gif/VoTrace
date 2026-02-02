"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User } from '@/types/auth'; // We'll update this type next
import {
    User as UserIcon,
    Settings,
    LogOut,
    ChartBar,
    Edit,
    ChevronDown
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Update Props
interface NavLinkItem {
    href: string;
    label: string;
    icon: any;
}

interface UserMenuProps {
    user: User | null;
    onLogout: () => void;
    navLinks?: NavLinkItem[]; // Added optional prop
}

export default function UserMenu({ user, onLogout, navLinks = [] }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Get initial from full_name or username
    const getInitial = () => {
        if (!user) return 'U';
        const name = user.full_name || user.username || 'User';
        return name.charAt(0).toUpperCase();
    };

    if (!user) {
        return null; // Don't render if no user (or render login link)
    }

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 focus:outline-none"
            >
                {/* Avatar Circle */}
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white text-primary flex items-center justify-center font-bold text-lg shadow-sm border-2 border-white/20 transition-transform hover:scale-105">
                    {user.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="w-full h-full rounded-full object-cover"
                        />
                    ) : (
                        <span>{getInitial()}</span>
                    )}
                </div>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 origin-top-right"
                    >
                        <div className="px-4 py-3 border-b border-slate-100">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                                {user.full_name || user.username}
                            </p>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                                {user.email}
                            </p>
                        </div>

                        {/* Mobile Navigation Links */}
                        <div className="py-1 md:hidden border-b border-slate-100">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <link.icon size={16} />
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        <div className="py-1">
                            <Link
                                href="/profile"
                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <UserIcon size={16} />
                                My Profile
                            </Link>
                            <Link
                                href="/statistics"
                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <ChartBar size={16} />
                                Statistics
                            </Link>
                            <Link
                                href="/profile?edit=true"
                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <Edit size={16} />
                                Edit Profile
                            </Link>
                            <Link
                                href="/settings"
                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <Settings size={16} />
                                Settings
                            </Link>
                        </div>

                        <div className="border-t border-slate-100 mt-1 pt-1">
                            <button
                                onClick={() => {
                                    onLogout();
                                    setIsOpen(false);
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                            >
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
