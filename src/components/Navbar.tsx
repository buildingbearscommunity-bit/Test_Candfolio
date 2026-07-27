'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useKorsayStore } from '@/lib/store';
import { Menu, X, FileText, Briefcase, HelpCircle, Mail, Mic, Files, Volume2 } from 'lucide-react';
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
      <header className="sticky top-0 z-40 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md no-print">
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

          <nav className="hidden sm:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-accent duration-150 ${
                  isActive(link.href) ? 'text-accent border-b-2 border-accent pt-1 pb-1' : 'text-zinc-600'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-4">
              <button className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-100 tap-active">
                Sign up
              </button>
              
              <Link href="/profile" className="flex items-center space-x-2 border border-zinc-100 p-1 pr-3 rounded-full hover:bg-zinc-50 transition-colors duration-150 tap-active">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-light text-accent text-xs font-semibold">
                  {getInitials(guestProfile.name)}
                </div>
                <span className="text-xs font-medium text-zinc-700 max-w-[100px] truncate">
                  {guestProfile.name}
                </span>
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 focus:outline-none sm:hidden tap-active"
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

          <div className="fixed right-0 top-0 bottom-0 w-80 bg-white p-6 shadow-xl flex flex-col justify-between">
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

              <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-xl mb-6">
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
                    className="text-xs text-center w-full bg-white text-zinc-700 py-1.5 rounded-lg border border-zinc-200 font-medium hover:bg-zinc-50 transition-colors tap-active"
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
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors tap-active ${
                      isActive(link.href) 
                        ? 'bg-accent-light/50 text-accent' 
                        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                    }`}
                  >
                    {link.name === 'Home' && <BrandLogoIcon className="h-4 w-4" />}
                    {link.name === 'Certifications' && <BrandLogoIcon className="h-4 w-4" />}
                    {link.name === 'Interviews' && <Briefcase className="h-4 w-4" />}
                    {link.name === 'SpeakPro' && <Mic className="h-4 w-4" />}
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
