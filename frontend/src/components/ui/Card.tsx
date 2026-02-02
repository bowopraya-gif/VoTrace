import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => {
    return (
        <div className={`bg-white rounded-xl shadow-md border border-neutral-100 p-6 ${className}`}>
            {children}
        </div>
    );
};
