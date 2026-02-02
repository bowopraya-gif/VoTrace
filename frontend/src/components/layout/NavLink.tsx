"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';

interface NavLinkProps {
    href: string;
    label: string;
    icon?: LucideIcon;
}

export default function NavLink({ href, label, icon: Icon }: NavLinkProps) {
    const pathname = usePathname();
    const isActive = pathname === href || pathname.startsWith(`${href}/`);

    return (
        <Link
            href={href}
            className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }
            `}
        >
            {Icon && <Icon size={18} className={isActive ? 'text-white' : 'text-blue-100'} />}
            <span>{label}</span>
        </Link>
    );
}
