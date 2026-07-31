'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useKorsayStore } from '@/lib/store';
import { Menu, X, FileText, Briefcase, HelpCircle, Mail, Mic, Files, Volume2, ListChecks, UserRound } from 'lucide-react';
import BrandLogoIcon from './BrandLogoIcon';

export default function Navbar() {
  const { guestProfile } = useKorsayStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Certifications', href: '/certifications' },
    { name: 'Interviews', href: '/interviews' },
    { name: 'SpeakPro', href: '/speakpro' },
    { name: 'Productivity', href: '/productivity' },
    { name: 'Portfolio', href: '/portfolio' },
    { name: 'Text to Speech', href: '/text-to-speech' },
    { name: 'PDF Tools', href: '/pdf-tools' },
    { name: 'Resume', href: '/resume' }
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'GU';
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-accent/10 bg-[#F0EDE5]/88 shadow-[0_12px_34px_rgba(100,61,70,0.14),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-md no-print">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex flex-shrink-0 items-center">
            <Link href="/" className="flex items-center gap-3 tap-active" aria-label="Candfolio home">
              <Image
                src="/korsay-logo-small.png"
                alt="Candfolio logo"
                width={48}
                height={48}
                className="h-11 w-11 object-contain sm:h-12 sm:w-12"
              />
              <span className="text-2xl font-extrabold tracking-tight text-accent sm:text-3xl">Candfolio</span>
            </Link>
          </div>

          <nav className="hidden rounded-full border border-accent/10 bg-white/45 px-3 py-1.5 shadow-[inset_2px_2px_7px_rgba(100,61,70,0.10),inset_-2px_-2px_7px_rgba(255,255,255,0.84)] sm:flex sm:space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-all duration-150 ${
                  isActive(link.href)
                    ? 'bg-white text-accent shadow-[5px_6px_14px_rgba(100,61,70,0.12),inset_0_1px_0_rgba(255,255,255,0.94)]'
                    : 'text-zinc-600 hover:bg-white/55 hover:text-accent hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.62)]'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-4">
              <button className="text-xs font-semibold text-zinc-600 hover:text-accent transition-all bg-white/70 px-3 py-1.5 rounded-xl border border-accent/10 shadow-[5px_6px_14px_rgba(100,61,70,0.10),inset_0_1px_0_rgba(255,255,255,0.88)] tap-active">
                Sign up
              </button>
              
              <Link href="/profile" className="flex items-center space-x-2 border border-accent/10 bg-white/58 p-1 pr-3 rounded-full shadow-[5px_6px_14px_rgba(100,61,70,0.10),inset_0_1px_0_rgba(255,255,255,0.88)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-white/75 tap-active">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-light text-accent text-xs font-semibold shadow-[inset_2px_2px_6px_rgba(100,61,70,0.10),inset_-2px_-2px_6px_rgba(255,255,255,0.80)]">
                  {getInitials(guestProfile.name)}
                </div>
                <span className="text-xs font-medium text-zinc-700 max-w-[100px] truncate">
                  {guestProfile.name}
                </span>
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl border border-accent/10 bg-white/55 text-zinc-500 shadow-[5px_6px_14px_rgba(100,61,70,0.10),inset_0_1px_0_rgba(255,255,255,0.88)] hover:text-accent focus:outline-none sm:hidden tap-active"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex sm:hidden no-print">
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-xs transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed right-0 top-0 bottom-0 w-80 border-l border-accent/10 bg-[#F0EDE5] p-6 shadow-[inset_1px_0_0_rgba(255,255,255,0.72),-18px_0_48px_rgba(100,61,70,0.18)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-6">
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 tap-active">
                  <Image
                    src="/korsay-logo-small.png"
                    alt="Candfolio logo"
                    width={44}
                    height={44}
                    className="h-11 w-11 object-contain"
                  />
                  <span className="text-2xl font-extrabold tracking-tight text-accent">Candfolio</span>
                </Link>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 tap-active"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-white/68 border border-accent/10 p-4 rounded-2xl mb-6 shadow-[8px_10px_22px_rgba(100,61,70,0.12),inset_0_1px_0_rgba(255,255,255,0.90)]">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-light text-accent font-semibold text-sm">
                    {getInitials(guestProfile.name)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-800">{guestProfile.name}</h4>
                    <p className="text-xs text-zinc-500">{guestProfile.email}</p>
                  </div>
                </div>
                <div className="mt-3 flex space-x-2">
                  <Link 
                    href="/profile" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs text-center w-full bg-white text-zinc-700 py-1.5 rounded-xl border border-accent/10 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.88),4px_5px_12px_rgba(100,61,70,0.08)] transition-all tap-active"
                  >
                    View profile
                  </Link>
                  <button className="text-xs text-center w-full bg-accent text-white py-1.5 rounded-lg font-medium hover:bg-accent-hover transition-colors tap-active">
                    Sign up
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all tap-active ${
                      isActive(link.href) 
                        ? 'bg-white text-accent shadow-[5px_6px_14px_rgba(100,61,70,0.10),inset_0_1px_0_rgba(255,255,255,0.88)]' 
                        : 'text-zinc-600 hover:bg-white/60 hover:text-accent hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.70)]'
                    }`}
                  >
                    {link.name === 'Home' && <BrandLogoIcon className="h-4 w-4" />}
                    {link.name === 'Certifications' && <BrandLogoIcon className="h-4 w-4" />}
                    {link.name === 'Interviews' && <Briefcase className="h-4 w-4" />}
                    {link.name === 'SpeakPro' && <Mic className="h-4 w-4" />}
                    {link.name === 'Productivity' && <ListChecks className="h-4 w-4" />}
                    {link.name === 'Portfolio' && <UserRound className="h-4 w-4" />}
                    {link.name === 'Text to Speech' && <Volume2 className="h-4 w-4" />}
                    {link.name === 'PDF Tools' && <Files className="h-4 w-4" />}
                    {link.name === 'Resume' && <FileText className="h-4 w-4" />}
                    <span>{link.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-4 text-xs text-zinc-400 space-y-2">
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-3.5 w-3.5 text-zinc-400" />
                <span>Help center & guides</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-3.5 w-3.5 text-zinc-400" />
                <span>contact@candfolio.com</span>
              </div>
              <p className="mt-2">© {new Date().getFullYear()} Candfolio inc.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
