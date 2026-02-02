import { AlertCircle, RefreshCw } from 'lucide-react';

interface QueryErrorStateProps {
    message?: string;
    onRetry?: () => void;
}

export default function QueryErrorState({
    message = 'Something went wrong. Please try again.',
    onRetry
}: QueryErrorStateProps) {
    return (
        <div className="text-center py-16 bg-red-50/50 rounded-2xl border border-red-100 animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-4 shadow-sm">
                <AlertCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Oops! Something went wrong</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 active:scale-95 transition-all shadow-md hover:shadow-lg"
                >
                    <RefreshCw size={18} />
                    Try Again
                </button>
            )}
        </div>
    );
}
