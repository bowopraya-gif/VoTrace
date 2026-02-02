import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps {
    type?: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    children: React.ReactNode;
}

export const Alert = ({ type = 'info', title, children }: AlertProps) => {
    const styles = {
        success: 'bg-green-50 text-green-900 border-green-200',
        error: 'bg-red-50 text-red-900 border-red-200',
        warning: 'bg-yellow-50 text-yellow-900 border-yellow-200',
        info: 'bg-blue-50 text-blue-900 border-blue-200',
    };

    const icons = {
        success: CheckCircle,
        error: XCircle,
        warning: AlertCircle,
        info: Info,
    };

    const Icon = icons[type];

    return (
        <div className={`rounded-lg border p-4 ${styles[type]} flex gap-3 items-start`}>
            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-sm">
                {title && <h5 className="font-medium mb-1">{title}</h5>}
                <div className="leading-relaxed opacity-90">{children}</div>
            </div>
        </div>
    );
};
