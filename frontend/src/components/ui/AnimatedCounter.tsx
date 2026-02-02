"use client";

import { useEffect, useState } from "react";

interface AnimatedCounterProps {
    value: number;
    duration?: number; // in milliseconds
    formatter?: (value: number) => string;
}

export default function AnimatedCounter({
    value,
    duration = 1500,
    formatter = (val) => val.toLocaleString()
}: AnimatedCounterProps) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        let animationFrame: number;
        const startValue = 0; // Always start from 0 as requested

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            // Ease out quart: 1 - (1 - t)^4
            // This starts fast and slows down at the end
            const easeOut = 1 - Math.pow(1 - percentage, 4);

            const current = startValue + (value - startValue) * easeOut;

            // If checking for completion
            if (percentage < 1) {
                setDisplayValue(current);
                animationFrame = requestAnimationFrame(animate);
            } else {
                setDisplayValue(value);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);

    return <>{formatter(displayValue)}</>;
}
