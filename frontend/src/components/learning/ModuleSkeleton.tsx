import React from 'react';

export default function ModuleSkeleton() {
    return (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm h-full flex flex-col">
            <div className="h-48 bg-slate-200 animate-pulse relative">
                <div className="absolute top-4 left-4 w-20 h-6 bg-slate-300 rounded-lg" />
            </div>
            <div className="p-6 space-y-4 flex-1">
                <div className="w-10 h-10 bg-slate-200 rounded-xl mb-2" />
                <div className="space-y-2">
                    <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse" />
                </div>
                <div className="pt-4 flex items-center justify-between">
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                    <div className="h-8 w-24 bg-slate-200 rounded-lg" />
                </div>
            </div>
        </div>
    );
}
