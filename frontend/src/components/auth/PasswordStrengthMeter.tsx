'use client';

interface PasswordStrengthMeterProps {
    password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
    const getStrength = (pwd: string): number => {
        let score = 0;
        if (!pwd) return 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (pwd.length >= 16) score++;
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[!@#$%^&*(),.?":{}|<>_]/.test(pwd)) score++;
        return Math.min(score, 4);
    };

    const strength = getStrength(password);
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['bg-gray-200', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
    const textColors = ['text-gray-400', 'text-red-500', 'text-orange-500', 'text-yellow-600', 'text-green-600'];

    return (
        <div className="mt-2 space-y-1">
            <div className="flex gap-1 h-1.5">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`flex-1 rounded-full transition-colors duration-300 ${i <= strength ? colors[strength] : 'bg-gray-200'
                            }`}
                    />
                ))}
            </div>
            {password && (
                <p className={`text-xs font-medium ${textColors[strength]} text-right`}>
                    {labels[strength]}
                </p>
            )}
        </div>
    );
}
