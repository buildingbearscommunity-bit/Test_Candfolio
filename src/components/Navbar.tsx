'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useKorsayStore } from '@/lib/store';
import {
  Calculator,
  ChevronDown,
  FileText,
  Files,
  HelpCircle,
  Mail,
  Menu,
  Mic,
  SearchCheck,
  UserRound,
  Volume2,
  X,
} from 'lucide-react';
import BrandLogoIcon from './BrandLogoIcon';

type NavItem = {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
};

const mainNavLinks: NavItem[] = [
  { name: 'Home', href: '/', icon: BrandLogoIcon },
  { name: 'Certifications', href: '/certifications', icon: BrandLogoIcon },
  { name: 'Interviews', href: '/interviews', icon: Mic },
  { name: 'Jobs', href: '/jobs', icon: SearchCheck },
  { name: 'SpeakPro', href: '/speakpro', icon: Mic },
  { name: 'Productivity', href: '/productivity', icon: FileText },
  { name: 'Portfolio', href: '/portfolio', icon: UserRound },
  { name: 'Resume', href: '/resume', icon: FileText },
];

const toolLinks: NavItem[] = [
  { name: 'PDF Tools', href: '/pdf-tools', icon: Files },
  { name: 'Text to Speech', href: '/text-to-speech', icon: Volume2 },
  { name: 'Calculators', href: '/calculators', icon: Calculator },
];

export default function Navbar() {
  const { guestProfile } = useKorsayStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(true);
  const pathname = usePathname();
  const toolsRef = useRef<HTMLDivElement | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'GU';
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const toolsActive = toolLinks.some((link) => isActive(link.href));
  const activateLinkWithKeyboard = (event: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.currentTarget.click();
  };

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!toolsRef.current?.contains(event.target as Node)) setToolsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setToolsOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full px-3 pt-2 no-print sm:px-5">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 rounded-[24px] border border-accent/10 bg-[#F0EDE5]/82 px-3 shadow-[0_16px_40px_rgba(100,61,70,0.16),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-xl transition-all duration-300 sm:px-4">
          <Link
            href="/"
            className="flex min-w-0 flex-shrink-0 items-center gap-2 rounded-2xl pr-2 transition hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-accent/10"
            aria-label="Candfolio home"
          >
            <Image
              src="/korsay-logo-small.png"
              alt="Candfolio logo"
              width={42}
              height={42}
              className="h-9 w-9 object-contain sm:h-10 sm:w-10"
            />
            <span className="hidden text-xl font-black tracking-tight text-accent sm:block lg:text-2xl">Candfolio</span>
          </Link>

          <nav aria-label="Primary navigation" className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
            <div className="flex max-w-full items-center gap-1 overflow-visible rounded-full border border-accent/10 bg-white/42 p-1 shadow-[inset_3px_3px_9px_rgba(100,61,70,0.10),inset_-3px_-3px_9px_rgba(255,255,255,0.80)]">
              {mainNavLinks.map((link) => (
                <DesktopNavLink key={link.name} link={link} active={isActive(link.href)} />
              ))}

              <div ref={toolsRef} className="relative">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={toolsOpen}
                  onClick={() => setToolsOpen((open) => !open)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') setToolsOpen(true);
                  }}
                  className={`group inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-bold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-accent/10 ${
                    toolsActive || toolsOpen
                      ? 'bg-white text-accent shadow-[6px_7px_16px_rgba(100,61,70,0.13),inset_0_1px_0_rgba(255,255,255,0.95)]'
                      : 'text-zinc-600 hover:bg-white/70 hover:text-accent'
                  }`}
                >
                  Tools
                  <ChevronDown className={`h-4 w-4 transition duration-200 ${toolsOpen ? 'rotate-180' : ''}`} />
                </button>

                <div
                  role="menu"
                  className={`absolute right-0 top-12 w-72 origin-top-right rounded-[22px] border border-accent/10 bg-[#F0EDE5]/90 p-2 shadow-[0_24px_60px_rgba(100,61,70,0.22),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-xl transition-all duration-200 ${
                    toolsOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
                  }`}
                >
                  <div className="px-3 pb-2 pt-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent/55">Document tools</p>
                  </div>
                  {toolLinks.map((tool) => {
                    const Icon = tool.icon || Files;
                    return (
                      <Link
                        key={tool.name}
                        role="menuitem"
                        href={tool.href}
                        onClick={() => setToolsOpen(false)}
                        onKeyDown={activateLinkWithKeyboard}
                        className={`group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-accent/10 ${
                          isActive(tool.href) ? 'bg-accent text-white shadow-[var(--shadow-button)]' : 'text-zinc-700 hover:bg-white/70 hover:text-accent hover:shadow-[var(--shadow-card)]'
                        }`}
                      >
                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${isActive(tool.href) ? 'bg-white/18' : 'bg-accent-light/70 text-accent'}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span>{tool.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </nav>

          <div className="flex flex-shrink-0 items-center gap-2">
            <div className="hidden items-center gap-2 sm:flex">
              <button className="h-9 rounded-full border border-accent/10 bg-white/62 px-4 text-xs font-black text-zinc-600 shadow-[5px_6px_14px_rgba(100,61,70,0.10),inset_0_1px_0_rgba(255,255,255,0.88)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/80 hover:text-accent focus:outline-none focus:ring-4 focus:ring-accent/10">
                Sign up
              </button>

              <Link
                href="/profile"
                className="flex h-10 items-center gap-2 rounded-full border border-accent/10 bg-white/58 p-1 pr-3 shadow-[5px_6px_14px_rgba(100,61,70,0.10),inset_0_1px_0_rgba(255,255,255,0.88)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/78 focus:outline-none focus:ring-4 focus:ring-accent/10"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-light text-xs font-black text-accent shadow-[inset_2px_2px_6px_rgba(100,61,70,0.10),inset_-2px_-2px_6px_rgba(255,255,255,0.80)]">
                  {getInitials(guestProfile.name)}
                </div>
                <span className="hidden max-w-[92px] truncate text-xs font-bold text-zinc-700 xl:block">{guestProfile.name}</span>
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-accent/10 bg-white/62 text-zinc-500 shadow-[5px_6px_14px_rgba(100,61,70,0.10),inset_0_1px_0_rgba(255,255,255,0.88)] transition hover:text-accent focus:outline-none focus:ring-4 focus:ring-accent/10 lg:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden no-print">
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed bottom-3 right-3 top-3 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col justify-between overflow-hidden rounded-[28px] border border-accent/10 bg-[#F0EDE5]/94 p-5 shadow-[0_28px_70px_rgba(100,61,70,0.24),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-xl">
            <div className="min-h-0">
              <div className="mb-5 flex items-center justify-between border-b border-accent/10 pb-4">
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-2xl focus:outline-none focus:ring-4 focus:ring-accent/10">
                  <Image src="/korsay-logo-small.png" alt="Candfolio logo" width={42} height={42} className="h-10 w-10 object-contain" />
                  <span className="text-2xl font-black tracking-tight text-accent">Candfolio</span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-2xl border border-accent/10 bg-white/60 p-2 text-zinc-500 shadow-[var(--shadow-card)] transition hover:text-accent"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-5 rounded-3xl border border-accent/10 bg-white/62 p-4 shadow-[8px_10px_22px_rgba(100,61,70,0.12),inset_0_1px_0_rgba(255,255,255,0.90)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-light text-sm font-black text-accent">
                    {getInitials(guestProfile.name)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-black text-zinc-800">{guestProfile.name}</h4>
                    <p className="truncate text-xs text-zinc-500">{guestProfile.email}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="rounded-2xl border border-accent/10 bg-white/70 py-2 text-center text-xs font-black text-zinc-700 shadow-[var(--shadow-card)]">
                    View profile
                  </Link>
                  <button className="rounded-2xl bg-accent py-2 text-xs font-black text-white shadow-[var(--shadow-button)]">
                    Sign up
                  </button>
                </div>
              </div>

              <div className="max-h-[calc(100vh-19rem)] space-y-1 overflow-y-auto pr-1 no-scrollbar">
                {mainNavLinks.map((link) => {
                  const Icon = link.icon || BrandLogoIcon;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition-all ${
                        isActive(link.href) ? 'bg-white text-accent shadow-[var(--shadow-card)]' : 'text-zinc-600 hover:bg-white/65 hover:text-accent'
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setMobileToolsOpen((open) => !open)}
                    aria-expanded={mobileToolsOpen}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-black transition-all ${
                      toolsActive ? 'bg-accent text-white shadow-[var(--shadow-button)]' : 'bg-white/48 text-zinc-700 hover:bg-white/70 hover:text-accent'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Files className="h-4 w-4" />
                      Tools
                    </span>
                    <ChevronDown className={`h-4 w-4 transition ${mobileToolsOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <div className={`grid transition-all duration-200 ${mobileToolsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <div className="mt-2 space-y-1 rounded-3xl border border-accent/10 bg-white/45 p-2">
                        {toolLinks.map((tool) => {
                          const Icon = tool.icon || Files;
                          return (
                            <Link
                              key={tool.name}
                              href={tool.href}
                              onClick={() => setMobileMenuOpen(false)}
                              onKeyDown={activateLinkWithKeyboard}
                              className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black transition ${
                                isActive(tool.href) ? 'bg-white text-accent shadow-[var(--shadow-card)]' : 'text-zinc-600 hover:bg-white/70 hover:text-accent'
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                              {tool.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-accent/10 pt-4 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Help center & guides</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
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

function DesktopNavLink({ link, active }: { link: NavItem; active: boolean }) {
  return (
    <Link
      href={link.href}
      className={`inline-flex h-9 items-center whitespace-nowrap rounded-full px-3 text-[13px] font-bold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-accent/10 ${
        active
          ? 'bg-white text-accent shadow-[6px_7px_16px_rgba(100,61,70,0.13),inset_0_1px_0_rgba(255,255,255,0.95)]'
          : 'text-zinc-600 hover:bg-white/70 hover:text-accent'
      }`}
    >
      {link.name}
    </Link>
  );
}
