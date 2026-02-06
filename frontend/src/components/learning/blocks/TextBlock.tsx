'use client';

import { ContentBlock } from '@/types/learning';
import { cn } from '@/lib/utils';
import DOMPurify from 'isomorphic-dompurify';

interface TextBlockProps {
    block: ContentBlock;
}

export default function TextBlock({ block }: TextBlockProps) {
    const { html, style } = block.content;

    const styles = {
        normal: 'text-slate-700 leading-relaxed',
        highlight: 'bg-yellow-50 p-6 rounded-xl border-l-4 border-yellow-400 text-slate-800',
        tip: 'bg-blue-50 p-6 rounded-xl border-l-4 border-blue-400 text-slate-800 italic',
        warning: 'bg-red-50 p-6 rounded-xl border-l-4 border-red-400 text-red-800',
    };

    const sanitizedHtml = DOMPurify.sanitize(html);

    return (
        <div
            className={cn("prose prose-slate max-w-none prose-base md:prose-lg animate-in fade-in slide-in-from-right-4", styles[style as keyof typeof styles] || styles.normal)}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
}
