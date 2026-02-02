import React, { useState } from 'react';
import { LucideIcon, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: React.ReactNode;
    error?: string;
    icon?: LucideIcon;
    validationState?: 'default' | 'loading' | 'success' | 'error';
    showValidationIcon?: boolean; // New prop to explicitly show check/x icons
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, icon: Icon, validationState = 'default', showValidationIcon = false, type = 'text', ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const isPassword = type === 'password';
        const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

        const getStateStyles = () => {
            if (error) return 'border-error ring-error';
            switch (validationState) {
                case 'error': return 'border-error ring-error';
                case 'success': return 'border-primary ring-primary';
                default: return 'border-neutral-300 focus:border-primary focus:ring-1 focus:ring-primary';
            }
        };

        const getIconColor = () => {
            if (validationState === 'success') return 'text-primary';
            if (validationState === 'error' || error) return 'text-error';
            return 'text-neutral-400';
        };

        // Determine right padding based on what elements will be there
        // Base padding: 3 (12px)
        // Eye icon: +24px -> pl-10 roughly
        // Validation icon: +24px
        // Loading: +24px
        // We accumulate right padding.
        let rightPaddingClass = 'pr-3';
        if (isPassword && (validationState === 'loading' || (showValidationIcon && validationState !== 'default'))) {
            rightPaddingClass = 'pr-20'; // Enough space for both
        } else if (isPassword || validationState === 'loading' || (showValidationIcon && validationState !== 'default')) {
            rightPaddingClass = 'pr-10'; // Space for one
        }

        return (
            <div className="w-full space-y-1">
                {label && (
                    <label className="text-sm font-medium text-neutral-700 block">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {Icon && (
                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${getIconColor()}`}>
                            <Icon size={18} />
                        </div>
                    )}
                    <input
                        ref={ref}
                        type={inputType}
                        className={`
                            w-full rounded-lg border bg-white py-2 text-sm placeholder:text-neutral-400
                            focus:outline-none 
                            disabled:cursor-not-allowed disabled:bg-neutral-50
                            transition-colors duration-200
                            ${Icon ? 'pl-10' : 'pl-3'}
                            ${rightPaddingClass}
                            ${getStateStyles()}
                            ${className}
                        `}
                        {...props}
                    />

                    {/* Right Side Icons Container */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {/* Validation Loading/Icon */}
                        {validationState === 'loading' && (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        )}
                        {!isLoading(validationState) && showValidationIcon && validationState === 'success' && (
                            <CheckCircle2 size={18} className="text-green-500" />
                        )}
                        {!isLoading(validationState) && showValidationIcon && (validationState === 'error' || error) && (
                            <XCircle size={18} className="text-red-500" />
                        )}

                        {/* Password Toggle */}
                        {isPassword && (
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-neutral-400 hover:text-neutral-600 focus:outline-none"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        )}
                    </div>
                </div>
                {error && (
                    <p className="text-xs text-error">{error}</p>
                )}
            </div>
        );
    }
);

function isLoading(state?: string) {
    return state === 'loading';
}

Input.displayName = 'Input';
