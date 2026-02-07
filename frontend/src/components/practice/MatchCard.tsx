import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MatchingItem } from "@/types/practice";

interface MatchCardProps {
    item: MatchingItem;
    isSelected: boolean;
    isMatched: boolean;
    isWrong: boolean;
    onClick: () => void;
}

export function MatchCard({ item, isSelected, isMatched, isWrong, onClick }: MatchCardProps) {
    return (
        <motion.button
            onClick={onClick}
            disabled={isMatched || isWrong} // Disable if matched OR permanently wrong
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
                opacity: isMatched || isWrong ? 0.5 : 1, // Faded for matched OR wrong
                scale: isMatched ? 0.95 : 1,
                x: isWrong ? [0, -8, 8, -8, 0] : 0, // Shake animation
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            whileTap={{ scale: 1.05 }} // Scale up on press
            transition={{ duration: 0.2 }}
            className={cn(
                // Base: Mobile-first 48px+ touch target
                // Desktop: 90px min-height to accommodate 2 lines of text consistently across all cards
                "min-h-[60px] md:min-h-[90px] h-full p-3 rounded-xl border-2 font-semibold",
                "flex items-center justify-center text-center",
                "transition-colors duration-200 w-full relative",
                // States
                isMatched && "bg-emerald-100 border-emerald-400 text-emerald-700 opacity-50", // Matched = faded
                isSelected && !isMatched && "bg-primary/20 border-primary ring-2 ring-primary/40 shadow-lg",
                isWrong && "bg-red-100 border-red-400 text-red-700 opacity-50", // Wrong = faded like matched
                !isSelected && !isMatched && !isWrong &&
                "bg-white border-slate-200 hover:border-primary/50 hover:shadow-md active:scale-95"
            )}
        >
            <span className="text-sm md:text-base lg:text-lg break-words leading-tight">
                {item.text}
            </span>

            {/* Match Checkmark */}
            {isMatched && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-md z-10"
                >
                    <Check size={14} strokeWidth={3} />
                </motion.div>
            )}

            {/* Wrong X Mark */}
            {isWrong && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-md z-10"
                >
                    <X size={14} strokeWidth={3} />
                </motion.div>
            )}
        </motion.button>
    );
}
