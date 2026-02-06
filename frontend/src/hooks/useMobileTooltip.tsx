import { useState, useLayoutEffect, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

export function useMobileTooltip() {
    // Only store essential state (existence & content)
    const [tooltipData, setTooltipData] = useState<{ content: React.ReactNode; element: HTMLElement } | null>(null);

    // Refs for direct manipulation to avoid re-renders on scroll
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const rafRef = useRef<number | null>(null);

    // Optimized position updater using direct DOM access
    const updatePosition = useCallback(() => {
        if (!tooltipData?.element || !tooltipRef.current) return;

        const element = tooltipData.element;
        const tooltip = tooltipRef.current;

        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top - 8; // 8px padding

        // Direct style update - bypasses React render cycle for 60fps smoothness
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
    }, [tooltipData]);

    // Handle Scroll & Resize
    useLayoutEffect(() => {
        if (!tooltipData) return;

        // Initial position before paint to prevent flicker
        updatePosition();

        const handleUpdate = () => {
            // Reset auto-close timer on interaction if desired, keeping it strict (3s from open) for now
            // if (timerRef.current) clearTimeout(timerRef.current);

            // Throttle with rAF
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(updatePosition);
        };

        // Capture scroll on window to catch all scrolling containers
        window.addEventListener('scroll', handleUpdate, { capture: true, passive: true });
        window.addEventListener('resize', handleUpdate);

        return () => {
            window.removeEventListener('scroll', handleUpdate, { capture: true } as any);
            window.removeEventListener('resize', handleUpdate);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [tooltipData, updatePosition]);

    // Auto-close timer logic
    useEffect(() => {
        if (tooltipData) {
            const timer = setTimeout(() => {
                setTooltipData(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [tooltipData]);

    const handleTap = (e: React.MouseEvent, content: React.ReactNode) => {
        if (e.button !== 0) return;

        e.stopPropagation();
        e.preventDefault();

        const element = e.currentTarget as HTMLElement;
        setTooltipData({ content, element });
    };

    // Close on outside click
    useLayoutEffect(() => {
        const closeTooltip = () => setTooltipData(null);
        if (tooltipData) {
            window.addEventListener('click', closeTooltip);
            window.addEventListener('touchstart', closeTooltip);
        }
        return () => {
            window.removeEventListener('click', closeTooltip);
            window.removeEventListener('touchstart', closeTooltip);
        };
    }, [tooltipData]);

    const TooltipComponent = () => (
        tooltipData && typeof document !== 'undefined' ? createPortal(
            <div
                ref={tooltipRef}
                className="fixed z-[9999] pointer-events-none transform -translate-x-1/2 -translate-y-full px-3 py-2 bg-slate-900/95 text-white text-xs rounded-lg shadow-xl border border-slate-700/50 backdrop-blur-sm transition-opacity duration-200 animate-in fade-in zoom-in-95 duration-200"
                style={{
                    left: 0,
                    top: 0,
                    willChange: 'transform, left, top' // Hint for GPU
                }}
            >
                {tooltipData.content}
                {/* Arrow */}
                <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900/95"></div>
            </div>,
            document.body
        ) : null
    );

    return { handleTap, TooltipComponent };
}
