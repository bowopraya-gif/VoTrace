"use client";

import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import Logo from './Logo';
import NavLink from './NavLink';
import UserMenu from './UserMenu';
import {
    Languages,
    GraduationCap,
    Target,
    BookOpen,
    Plus
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { useNavigationPrefetch } from '@/hooks/useNavigationPrefetch';

export default function Header() {
    const { user, logout } = useAuthStore();
    const { prefetchPage } = useNavigationPrefetch();
    const [scrolled, setScrolled] = useState(false);

    // Add shadow on scroll
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { href: '/translate', label: 'Translate', icon: Languages },
        { href: '/learning', label: 'Learning', icon: GraduationCap },
        { href: '/practice', label: 'Practice', icon: Target },
        { href: '/vocabulary', label: 'Vocabulary', icon: BookOpen },
    ];

    return (
        <header
            className={`
                sticky top-0 z-50 w-full transition-all duration-300
                bg-primary text-white border-b border-primary-hover
                ${scrolled ? 'shadow-md shadow-primary/20' : ''}
            `}
        >
            <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">

                {/* Mobile Layout: [+] Logo 👤 */}
                <div className="md:hidden flex items-center justify-between w-full">
                    {/* Left: Add Button */}
                    <Link
                        href="/vocabulary/add"
                        className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
                        aria-label="Add Vocabulary"
                    >
                        <Plus size={22} />
                    </Link>

                    {/* Center: Logo */}
                    <div className="absolute left-1/2 -translate-x-1/2">
                        <Logo />
                    </div>

                    {/* Right: User Menu (Includes Nav Links on Mobile) */}
                    <UserMenu user={user} onLogout={logout} navLinks={navLinks} />
                </div>

                {/* Desktop Layout: Logo | Nav (Centered) | Actions (Right) */}
                <div className="hidden md:flex items-center w-full justify-between">
                    {/* Logo Area */}
                    <div className="flex-shrink-0 w-[200px]">
                        {/* Fixed width to help centering the nav if we use flex-1 and justify-center between sibling divs? 
                           Or better: Use absolute centering or grid?
                           Let's use Flex with justify-between and make the Navigation absolute centered? 
                           Or just flex-1 and justify-center for the middle part. 
                           To perfectly center the middle part, the left and right parts should ideally have the same width or we use absolute positioning for the middle. 
                           Let's try flex-1 justify-center for the nav.
                        */}
                        <Logo />
                    </div>

                    {/* Navigation Links - Centered */}
                    <nav className="flex items-center justify-center gap-2 flex-1">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.href}
                                {...link}
                                onMouseEnter={() => prefetchPage(link.href)}
                            />
                        ))}
                    </nav>

                    {/* Right Actions: Add + User */}
                    <div className="flex items-center justify-end gap-4 w-[200px]">
                        <Link
                            href="/vocabulary/add"
                            className="
                                flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 
                                rounded-full text-sm font-medium transition-all text-white
                                border border-white/20 hover:scale-105 active:scale-95
                            "
                        >
                            <Plus size={18} />
                            {/* Icon only or text? Previous had text 'Add Word' then removed it? 
                               Step 939 removed span 'Add Word'.
                               I will keep it icon only or re-add text if space permits? 
                               User didn't complain about text removal in 939 (user did it).
                               I'll keep it icon only or maybe restore text if the header is larger? 
                               Actually, step 939 showed the USER removed the text. So I should RESPECT that.
                               Wait, I'll follow the user's edit in 939 which removed the text.
                            */}
                        </Link>

                        <div className="w-px h-8 bg-white/20 mx-1"></div>

                        <UserMenu user={user} onLogout={logout} />
                    </div>
                </div>
            </div>
        </header>
    );
}
