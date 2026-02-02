'use client';

interface ChartSkeletonProps {
    type?: 'pie' | 'bar' | 'line' | 'heatmap';
}

export default function ChartSkeleton({ type = 'bar' }: ChartSkeletonProps) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
            {/* Title skeleton */}
            <div className="h-5 w-32 bg-slate-200 rounded mb-4" />

            {/* Chart shape skeleton */}
            <div className="h-64 flex items-end justify-center gap-2">
                {type === 'pie' && (
                    <div className="w-40 h-40 rounded-full bg-slate-200" />
                )}

                {type === 'bar' && (
                    <>
                        <div className="w-8 h-24 bg-slate-200 rounded-t" />
                        <div className="w-8 h-40 bg-slate-200 rounded-t" />
                        <div className="w-8 h-32 bg-slate-200 rounded-t" />
                        <div className="w-8 h-48 bg-slate-200 rounded-t" />
                        <div className="w-8 h-36 bg-slate-200 rounded-t" />
                        <div className="w-8 h-28 bg-slate-200 rounded-t" />
                    </>
                )}

                {type === 'line' && (
                    <div className="w-full h-full relative">
                        <svg className="w-full h-full" viewBox="0 0 300 150">
                            <path
                                d="M 0 120 Q 50 80, 100 100 T 200 60 T 300 80"
                                stroke="#E2E8F0"
                                strokeWidth="3"
                                fill="none"
                            />
                        </svg>
                    </div>
                )}

                {type === 'heatmap' && (
                    <div className="grid grid-cols-12 gap-1 w-full">
                        {Array.from({ length: 84 }).map((_, i) => (
                            <div
                                key={i}
                                className="aspect-square bg-slate-200 rounded-sm"
                                style={{ opacity: 0.3 + Math.random() * 0.7 }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
