'use client';

import { useState } from 'react';
import NextImage from 'next/image';
import { ContentBlock } from '@/types/learning';
import { cn } from '@/lib/utils';

interface ImageBlockProps {
    block: ContentBlock;
}

export default function ImageBlock({ block }: ImageBlockProps) {
    const { url, caption, alt } = block.content;
    const [error, setError] = useState(false);

    return (
        <figure className="my-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-100 bg-slate-50 min-h-[300px] flex items-center justify-center">
                {!error ? (
                    <div className="relative w-full h-full min-h-[300px]">
                        <NextImage
                            src={url}
                            alt={alt || 'Lesson Image'}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 800px"
                            className="object-contain"
                            onError={() => setError(true)}
                            priority={false}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-slate-300">
                        <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium">Image could not be loaded</span>
                    </div>
                )}
            </div>
            {caption && (
                <figcaption className="mt-3 text-center text-sm font-medium text-slate-500 italic">
                    {caption}
                </figcaption>
            )}
        </figure>
    );
}
