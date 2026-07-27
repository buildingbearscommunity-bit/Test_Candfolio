'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageSquare, FileText, User } from 'lucide-react';
import BrandLogoIcon from './BrandLogoIcon';

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Exams', href: '/certifications', icon: BrandLogoIcon },
    { name: 'Interviews', href: '/interviews', icon: MessageSquare },
    { name: 'Resume', href: '/resume', icon: FileText },
    { name: 'Profile', href: '/profile', icon: User }
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-zinc-100 bg-white/95 backdrop-blur-md flex justify-around items-center px-2 sm:hidden no-print">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center select-none tap-active transition-colors duration-150 ${
              active ? 'text-accent' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <Icon className="h-5.5 w-5.5 stroke-[1.75]" />
            <span className="text-[10px] font-medium mt-1 leading-none">{tab.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
