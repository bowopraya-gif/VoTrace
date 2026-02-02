import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    fullWidth?: boolean;
    icon?: React.ElementType;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', isLoading, fullWidth, icon: Icon, children, disabled, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

        const variants = {
            primary: "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/25 border border-transparent",
            secondary: "bg-secondary text-white hover:bg-secondary-hover shadow-lg shadow-secondary/25 border border-transparent",
            outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm",
            ghost: "text-slate-600 hover:bg-slate-100/50 hover:text-slate-900",
        };

        const sizes = {
            sm: "px-3 py-1.5 text-xs",
            md: "px-5 py-2.5 text-sm",
            lg: "px-8 py-3.5 text-base",
        };

        const widthStyles = fullWidth ? "w-full" : "";

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyles} ${className}`}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : Icon ? (
                    <Icon className="mr-2 h-4 w-4" />
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
