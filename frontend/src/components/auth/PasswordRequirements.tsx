'use client';

import { Check, X } from 'lucide-react';

interface PasswordRequirementsProps {
    password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
    const requirements = [
        { label: 'At least 12 characters', met: password.length >= 12 },
        { label: 'Uppercase & Lowercase letters', met: /[A-Z]/.test(password) && /[a-z]/.test(password) },
        { label: 'Number (0-9)', met: /[0-9]/.test(password) },
        { label: 'Special character (!@#$%^&*_)', met: /[!@#$%^&*(),.?":{}|<>_]/.test(password) },
    ];

    return (
        <ul className="mt-3 space-y-1.5">
            {requirements.map((req, idx) => (
                <li
                    key={idx}
                    className={`flex items-center gap-2 text-xs transition-colors duration-200 ${req.met ? 'text-green-600 font-medium' : 'text-gray-500'
                        }`}
                >
                    {req.met ? (
                        <Check size={14} className="text-green-500" />
                    ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-gray-300 flex items-center justify-center">
                            <div className="w-1 h-1 rounded-full bg-gray-300" />
                        </div>
                    )}
                    {req.label}
                </li>
            ))}
        </ul>
    );
}
