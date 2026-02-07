import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MatchingQuestion as MatchingQuestionType, MatchingResult, MatchingItem } from '@/types/practice';
import { MatchCard } from './MatchCard';
import { useConfetti } from '@/hooks/useConfetti';

interface MatchingQuestionProps {
    question: MatchingQuestionType;
    onComplete: (results: MatchingResult[], totalTimeMs: number) => void;
    onProgress: (solvedCount: number) => void;
    disabled: boolean;
}

export function MatchingQuestion({ question, onComplete, onProgress, disabled }: MatchingQuestionProps) {
    const [selected, setSelected] = useState<MatchingItem | null>(null);
    const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
    // Wrong pairs are now permanent for this round
    const [wrongItems, setWrongItems] = useState<Set<string>>(new Set());
    const [results, setResults] = useState<MatchingResult[]>([]);

    // Round timer tracking
    const [roundStartTime] = useState(Date.now());
    const pairTimes = useRef<Record<string, number>>({});

    const { triggerConfetti } = useConfetti();

    // Split items by type for the layout
    // We assume item.type 'source' is English/Left/Top and 'target' is ID/Right/Bottom
    // We need to maintain the shuffled order but separated by type.
    // Actually, usually Duolingo shuffles both sides independently.
    // The current `question.items` is already a mixed shuffled list from backend.
    // We should separate them and maybe re-sort or just filter?
    // Backend sends them mixed. Let's filter.
    const sourceItems = question.items.filter(i => i.type === 'source');
    const targetItems = question.items.filter(i => i.type === 'target');

    // We want the sides to be shuffled relative to each other, which they are (from backend shuffle).
    // But backend returns a single flattened shuffled array.
    // If we just filter, we preserve the backend shuffle order within that type. Good.

    const handleCardClick = (item: MatchingItem) => {
        if (disabled || matchedPairs.has(item.pair_id) || wrongItems.has(item.id)) return;

        // Play sound effect here ideally (tap)

        if (!selected) {
            // First selection
            setSelected(item);
            // Mark start time for this specific pair attempt
            if (!pairTimes.current[item.pair_id]) {
                pairTimes.current[item.pair_id] = Date.now();
            }
        } else if (selected.id === item.id) {
            // Deselect
            setSelected(null);
        } else {
            // Second selection
            // Prevent selecting same type (e.g. Source + Source)
            if (selected.type === item.type) {
                setSelected(item); // Just switch selection
                return;
            }

            checkMatch(selected, item);
        }
    };

    const checkMatch = (card1: MatchingItem, card2: MatchingItem) => {
        const isCorrect = card1.pair_id === card2.pair_id;
        const now = Date.now();
        const startTime = pairTimes.current[card1.pair_id] || roundStartTime;
        const timeSpent = now - startTime;

        if (isCorrect) {
            // Correct match
            const newMatched = new Set(matchedPairs);
            newMatched.add(card1.pair_id);
            setMatchedPairs(newMatched);

            // Check win condition (all pairs processed)
            // Note: Since wrong items are disabled, we might finish with some wrong.
            // But usually validation happens at end? 
            // Or do we auto-advance when all items are interacted with?
            // "Round completion logic must account for items that are dead (wrong)"
        } else {
            // Wrong match - STRICT MODE REFINED
            // Disable the FIRST selected card (card1) AND its CORRECT PARTNER (not the wrong card2)
            // This reveals the answer ("Oh, Dog was Anjing") and creates a "dead pair"
            // Card2 (the wrong guess) remains active/playable.

            const correctPartner = question.items.find(i => i.pair_id === card1.pair_id && i.id !== card1.id);

            if (correctPartner) {
                setWrongItems(prev => new Set([...prev, card1.id, correctPartner.id]));
            }
        }

        // Record result
        setResults(prev => [...prev, {
            vocabulary_id: card1.pair_id,
            is_correct: isCorrect,
            time_spent_ms: timeSpent,
        }]);

        setSelected(null);
    };

    // Buffer completion
    useEffect(() => {
        // Completion condition: No available moves left.
        // All items are either in matchedPairs (via pair_id) or in wrongItems (via item.id)

        // Count items involved in matched pairs
        const matchedItemCount = matchedPairs.size * 2;
        const wrongItemCount = wrongItems.size;

        // Notify parent of progress (pairs solved/attempted)
        const solvedPairs = matchedPairs.size + Math.floor(wrongItems.size / 2);
        onProgress(solvedPairs);

        if (matchedItemCount + wrongItemCount === question.items.length) {
            const timer = setTimeout(() => {
                const totalTime = Date.now() - roundStartTime;
                // Filter duplicate results or just send all
                // Filter results to ensure we send valid data
                // We might have duplicate `vocabulary_id` entries if we pushed 2 above.
                // It's safer to dedup by vocab_id + status? 
                // Let's just send it, backend handles batch.
                onComplete(results, totalTime);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [matchedPairs, wrongItems, question.items.length, onComplete, results, roundStartTime]);

    return (
        <div className="w-full max-w-none mx-auto flex flex-col gap-6 p-4">

            {/* Desktop Layout: Top Row (Source/English) -> Bottom Row (Target/Indo) */}
            {/* Mobile Layout: Left Col (Source) -> Right Col (Target) */}

            <div className="flex flex-row md:flex-col gap-4 md:gap-8 h-full">

                {/* English / Source Group */}
                <div className="flex-1 flex flex-col md:flex-row md:flex-nowrap gap-3 justify-center content-start md:content-center">
                    <h3 className="w-full text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 md:hidden">English</h3>
                    {sourceItems.map((item) => (
                        <div key={item.id} className="w-full md:w-48 shrink-0">
                            <MatchCard
                                item={item}
                                isSelected={selected?.id === item.id}
                                isMatched={matchedPairs.has(item.pair_id)}
                                isWrong={wrongItems.has(item.id)}
                                onClick={() => handleCardClick(item)}
                            />
                        </div>
                    ))}
                </div>

                {/* Divider / Spacer */}
                <div className="w-px bg-slate-100 md:w-full md:h-px self-stretch" />

                {/* Indonesian / Target Group */}
                <div className="flex-1 flex flex-col md:flex-row md:flex-nowrap gap-3 justify-center content-start md:content-center">
                    <h3 className="w-full text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 md:hidden">Indonesia</h3>
                    {targetItems.map((item) => (
                        <div key={item.id} className="w-full md:w-48 shrink-0">
                            <MatchCard
                                item={item}
                                isSelected={selected?.id === item.id}
                                isMatched={matchedPairs.has(item.pair_id)}
                                isWrong={wrongItems.has(item.id)}
                                onClick={() => handleCardClick(item)}
                            />
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
