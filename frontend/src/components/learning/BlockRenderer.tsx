'use client';

import { memo } from 'react';
import { ContentBlock } from '@/types/learning';
import TextBlock from './blocks/TextBlock';
import ImageBlock from './blocks/ImageBlock';
import VideoBlock from './blocks/VideoBlock';
import VocabularyBlock from './blocks/VocabularyBlock';
import QuizMCBlock from './blocks/QuizMCBlock';
import QuizTypingBlock from './blocks/QuizTypingBlock';
import { cn } from '@/lib/utils';

interface BlockRendererProps {
    block: ContentBlock;
    isCompleted?: boolean;
    onBlockComplete: (blockId: number, isCorrect: boolean) => void;
}

function BlockRenderer({ block, isCompleted = false, onBlockComplete }: BlockRendererProps) {

    // Components Map (Strategy Pattern)
    const renderContent = () => {
        switch (block.type) {
            case 'text':
                return <TextBlock block={block} />;
            case 'image':
                return <ImageBlock block={block} />;
            case 'video':
                return <VideoBlock block={block} />;
            case 'vocabulary':
                return <VocabularyBlock block={block} isCompleted={isCompleted} onBlockComplete={onBlockComplete} />;
            case 'quiz_mc':
                return <QuizMCBlock block={block} isCompleted={isCompleted} onComplete={(success) => onBlockComplete(block.id, success)} />;
            case 'quiz_typing':
                return <QuizTypingBlock block={block} isCompleted={isCompleted} onComplete={(success) => onBlockComplete(block.id, success)} />;
            case 'divider':
                return <div className="h-px bg-slate-200 my-8 w-full" />;
            default:
                return <div className="p-4 bg-red-50 text-red-500">Unknown Block Type: {block.type}</div>;
        }
    };

    return (
        <div className={cn("scroll-mt-24")} id={`block-${block.id}`}>
            {renderContent()}
        </div>
    );
}

// Memoize to prevent re-renders when other blocks update
export default memo(BlockRenderer, (prevProps, nextProps) => {
    return (
        prevProps.block.id === nextProps.block.id &&
        prevProps.isCompleted === nextProps.isCompleted
    );
});

