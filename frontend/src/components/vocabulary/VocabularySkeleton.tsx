'use client';

import React from 'react';

export const VocabularySkeleton = () => {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            {/* Header Skeleton */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-4">
                <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
                <div className="h-5 w-20 bg-slate-200 rounded animate-pulse ml-auto" />
            </div>

            {/* Rows Skeleton */}
            {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 border-b border-slate-50 flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse" />
                    <div className="flex-1 space-y-2">
                        <div className="h-5 w-1/3 bg-slate-200 rounded animate-pulse" />
                        <div className="h-4 w-1/4 bg-slate-100 rounded animate-pulse" />
                    </div>
                    <div className="h-6 w-16 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="h-8 w-8 bg-slate-100 rounded-lg animate-pulse" />
                </div>
            ))}
        </div>
    );
};
