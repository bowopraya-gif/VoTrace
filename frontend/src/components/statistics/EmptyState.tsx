'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface EmptyStateProps {
    title: string;
    message: string;
    emoji?: string;
    actionLabel?: string;
    actionHref?: string;
}

export default function EmptyState({ title, message, emoji = '📊', actionLabel, actionHref }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-6 text-center"
        >
            <span className="text-6xl mb-4">{emoji}</span>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">{title}</h3>
            <p className="text-slate-500 max-w-md mb-6">{message}</p>

            {actionLabel && actionHref && (
                <Link
                    href={actionHref}
                    className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                    {actionLabel}
                </Link>
            )}
        </motion.div>
    );
}
