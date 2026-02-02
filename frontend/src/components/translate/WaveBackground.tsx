
"use client";

import React, { useEffect, useRef } from 'react';

interface WaveBackgroundProps {
    isSpeaking?: boolean;
}

export default function WaveBackground({ isSpeaking = false }: WaveBackgroundProps) {
    const pathRef = useRef<SVGPathElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Animation state refs (to avoid re-renders)
    const timeRef = useRef(0);
    const mouseRef = useRef({ x: -1000, y: -1000 });
    // State for smoothed cursor position (easing)
    const smoothMouseRef = useRef({ x: -1000, y: -1000 });
    const animationFrameRef = useRef<number>(0);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        const handleMouseLeave = () => {
            mouseRef.current = { x: -1000, y: -1000 };
        };

        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    useEffect(() => {
        const animate = () => {
            timeRef.current += 0.005;
            const time = timeRef.current;

            // Audio reactivity - slight boost
            const audioAmp = isSpeaking ? 20 : 0;
            // Increased base amplitude for "terasa" default state
            const baseAmp = 8;

            // Smooth mouse values (LERP)
            // Linear Interpolation: current + (target - current) * factor
            // Factor 0.1 gives a nice smoothness
            smoothMouseRef.current.x += (mouseRef.current.x - smoothMouseRef.current.x) * 0.1;
            smoothMouseRef.current.y += (mouseRef.current.y - smoothMouseRef.current.y) * 0.1;

            const points = [];
            const segments = 20;
            const width = 120;
            const height = 100;

            for (let i = 0; i <= segments; i++) {
                const y = (i / segments) * height;
                const normalizedY = i / segments;

                // 1. Idle Sine Wave - More movement
                // Increased multipliers for more visible oscillation
                const wave1 = Math.sin(y * 0.15 + time * 1.5) * (baseAmp + audioAmp * 0.4);
                const wave2 = Math.cos(y * 0.08 - time * 0.8) * (baseAmp * 0.6);

                // Base position shifted slightly left to allow more room for "bulge"
                let x = 35 + wave1 + wave2;

                // Static shape offset
                x += 15 * Math.sin(normalizedY * Math.PI);

                // 2. Smoothed Cursor Repulsion
                if (containerRef.current) {
                    const rect = containerRef.current.getBoundingClientRect();
                    const pixelY = normalizedY * rect.height;
                    const pixelX = (x / 100) * rect.width;

                    // Use SMOOTHED mouse position
                    const dx = smoothMouseRef.current.x - pixelX;
                    const dy = smoothMouseRef.current.y - pixelY;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    const repelRadius = 1500; // Large radius for subtle far-field effect, but decay fast
                    // Actually, keep radius reasonable but easing smooth
                    const interactionRadius = 250;

                    if (dist < interactionRadius) {
                        // Smooth falloff curve (cubic ease-out style)
                        const rawForce = Math.max(0, 1 - dist / interactionRadius);
                        const force = rawForce * rawForce; // Quadratic falloff for smoother "edge" feel

                        // Calculate repel direction
                        // We want to yield mainly in X direction.
                        // Ideally vector based: push away from cursor.

                        // Push Intensity
                        const maxPush = 60;

                        // Directionality:
                        // If cursor is to the right (dx > 0), we push left (negative value).
                        // If cursor is to the left (dx < 0), we push right? Or just clamping?
                        // The user said "don't reverse suddenly". 

                        // Standard Repel logic:
                        // vector = (dx, dy) / dist
                        // displacement = -vector * force * maxPush

                        // We only care about X displacement for the wave boundary
                        let dirX = dx / (dist + 0.01); // avoid divide by zero

                        // Repel means we subtract direction
                        let moveX = -dirX * force * maxPush;

                        // Damping when passing the line (dx changes sign):
                        // Because we use `smoothMouseRef`, `dx` won't flip instantly.
                        // And because we use `dist` in the force, force is max at dist=0.
                        // Standard vector fields are stable at 0.

                        x += moveX;
                    }
                }

                points.push({ x, y });
            }

            let d = `M -1 0`;
            d += ` L ${points[0].x} ${points[0].y}`;

            for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i];
                const p1 = points[i + 1];
                const mx = (p0.x + p1.x) / 2;
                const my = (p0.y + p1.y) / 2;
                d += ` Q ${p0.x} ${p0.y} ${mx} ${my}`;
            }

            const last = points[points.length - 1];
            d += ` L ${last.x} ${last.y}`;
            d += ` L -1 100 L -1 0 Z`;

            if (pathRef.current) {
                pathRef.current.setAttribute('d', d);
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isSpeaking]);

    return (
        <div ref={containerRef} className="absolute top-0 -right-[120px] w-[121px] h-full pointer-events-none text-[#101c22] z-20 hidden md:block overflow-visible">
            <svg
                className="h-full w-full fill-current block overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 100 100" // Use 0-100 coordinate system
                xmlns="http://www.w3.org/2000/svg"
            >
                <path ref={pathRef} d="" />
            </svg>
        </div>
    );
}
