'use client';

import { ContentBlock } from '@/types/learning';
import { YouTubeEmbed } from '@next/third-parties/google';

interface VideoBlockProps {
    block: ContentBlock;
}

export default function VideoBlock({ block }: VideoBlockProps) {
    const { url, caption } = block.content;

    // Helper to extract Video ID
    const getVideoId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = getVideoId(url);

    if (!videoId) {
        return (
            <div className="p-4 bg-slate-100 rounded-xl text-slate-500 text-sm">
                Invalid Video URL
            </div>
        );
    }

    return (
        <figure className="my-8 w-full max-w-3xl mx-auto">
            <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-slate-900">
                <YouTubeEmbed videoid={videoId} params="controls=1" style="border-radius: 1rem;" />
            </div>
            {caption && (
                <figcaption className="mt-3 text-center text-sm font-medium text-slate-500 italic">
                    {caption}
                </figcaption>
            )}
        </figure>
    );
}
