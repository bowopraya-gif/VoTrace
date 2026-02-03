import Link from 'next/link';

interface LogoProps {
    className?: string;
    showText?: boolean;
}

export default function Logo({ className = '', showText = true }: LogoProps) {
    return (
        <Link
            href="/dashboard"
            className={`flex items-center gap-2 group ${className}`}
        >
            <div className="bg-white text-primary w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xl shadow-sm transition-transform group-hover:scale-105">
                V
            </div>
            {showText && (
                <span className="font-bold text-xl text-white tracking-tight">
                    VoTrace
                </span>
            )}
        </Link>
    );
}
