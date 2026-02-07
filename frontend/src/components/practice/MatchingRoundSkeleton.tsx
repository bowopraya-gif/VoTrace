import { cn } from "@/lib/utils";

export function MatchingRoundSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 p-4 animate-pulse">
            {[...Array(10)].map((_, i) => (
                <div
                    key={i}
                    className="min-h-[56px] md:min-h-[64px] bg-slate-100 rounded-xl w-full"
                />
            ))}
        </div>
    );
}
