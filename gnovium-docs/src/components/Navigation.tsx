'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Search, Command, Sun, Moon, Star, ExternalLink } from 'lucide-react';
import SearchPalette from '@/components/SearchPalette';
import { useTheme } from '@/components/ThemeProvider';

export default function Navigation() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Global CMD+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--nav-bg)] backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Left - Logo */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 group" aria-label="Gnovium Docs Home">
                <div className="relative h-10 w-10 overflow-hidden rounded-none border-2 border-[var(--foreground)] bg-[var(--card-bg)] shadow-[3px_3px_0px_0px_var(--shadow-color)] transition-all group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-none">
                  <Image
                    src="/logo/gnovium.jpeg"
                    alt="Gnovium logo"
                    fill
                    sizes="40px"
                    className="object-cover"
                    priority
                  />
                </div>
                <span className="text-sm font-black tracking-widest text-[var(--foreground)] transition-colors group-hover:opacity-70 uppercase font-mono">
                  GNOVIUM <span className="text-[9px] font-black px-2 py-0.5 rounded-none bg-[var(--foreground)] text-[var(--background)] border-2 border-[var(--foreground)] ml-1 tracking-normal font-sans">DOCS</span>
                </span>
              </Link>
            </div>

            {/* Center - Creator Credit with GitHub Stars */}
            <div className="hidden md:flex items-center justify-center">
              <div className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground)] flex items-center gap-3">
                <span className="opacity-60">CREATED BY</span>
                <a
                  href="https://www.linkedin.com/in/gaurav-kaloliya-b44569417"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-100 transition-opacity border-b-2 border-[var(--foreground)] pb-px font-bold"
                >
                  GAURAV KALOLIYA
                </a>
                <span className="opacity-30">|</span>
                <a
                  href="https://github.com/GauravKaloliya/gnovium"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-100 transition-opacity flex items-center gap-1.5 group border border-[var(--border)] px-2 py-0.5 bg-[var(--card-bg)]"
                >
                  <Star className="h-3 w-3 fill-current" /> STAR ON GITHUB
                  <ExternalLink className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100" />
                </a>
              </div>
            </div>

            {/* Right - Theme Toggle + Search */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={toggle}
                  className="p-2.5 rounded-none border-2 border-[var(--border)] neo-depth-btn text-[var(--foreground)] cursor-pointer"
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <Moon className="h-4 w-4" strokeWidth={2.5} />
                  )}
                </button>
              )}

              {/* Search Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center justify-between w-64 lg:w-80 rounded-none bg-[var(--card-bg)] border-2 border-[var(--border)] px-4 py-2.5 text-xs text-[var(--foreground)] font-bold transition-all neo-depth-btn cursor-pointer"
                aria-label="Search endpoints"
              >
                <div className="flex items-center gap-2.5">
                  <Search className="h-3.5 w-3.5 stroke-[2.5] text-[var(--muted)]" />
                  <span className="font-mono uppercase tracking-wider text-[var(--muted)]">
                    Search endpoints...
                  </span>
                </div>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded-none border border-[var(--border)] bg-[var(--card-bg)] px-1.5 font-mono text-[9px] font-medium text-[var(--muted)]">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Global Search Palette */}
      <AnimatePresence>
        {searchOpen && (
          <SearchPalette onClose={() => setSearchOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
