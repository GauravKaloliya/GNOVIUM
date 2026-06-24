'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Search, Command, Sun, Moon, Star, ExternalLink, Download } from 'lucide-react';
import SearchPalette from '@/components/SearchPalette';
import { useTheme } from '@/components/ThemeProvider';

export default function Navigation() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onScroll = () => {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress(height > 0 ? (winScroll / height) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />
      <nav className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--nav-bg)] backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between gap-4">
            {/* Left - Logo */}
            <div className="flex items-center gap-3 shrink-0">
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
                  GNOVIUM <span className="text-[10px] font-black px-2 py-0.5 rounded-none bg-[var(--foreground)] text-[var(--background)] border-2 border-[var(--foreground)] ml-1 tracking-normal font-sans">DOCS</span>
                </span>
              </Link>
            </div>

            {/* Center - Creator Credit */}
            <div className="hidden md:flex items-center gap-4">
              <div className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-[var(--foreground)] flex items-center gap-2">
                <span className="opacity-60">Created by</span>
                <a
                  href="https://www.linkedin.com/in/gaurav-kaloliya-b44569417"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity border-b-2 border-[var(--foreground)] pb-px font-bold"
                >
                  Gaurav Kaloliya
                </a>
              </div>
            </div>

            {/* Center-right - Status + Progress */}
            <div className="hidden xl:flex items-center gap-4 ml-4">
              {/* API Status */}
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400">API</span>
                <span className="text-[var(--muted)]">Healthy</span>
              </div>
              <div className="w-px h-4 bg-[var(--border)]" />
              {/* Docs progress */}
              <DocsProgress />
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2.5 ml-auto">
              {/* GitHub Star */}
              <a
                href="https://github.com/GauravKaloliya/gnovium"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 border-2 border-[var(--border)] text-[11px] font-black font-mono uppercase tracking-wider text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] transition-all bg-[var(--card-bg)]"
              >
                <Star className="h-3 w-3 fill-current" />
                <span>Star</span>
                <ExternalLink className="h-2.5 w-2.5 opacity-60" />
              </a>

              {/* Download */}
              <Link
                href="/download"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border-2 border-[var(--foreground)] text-[11px] font-black font-mono uppercase tracking-wider bg-[var(--foreground)] text-[var(--background)] hover:opacity-80 transition-all neo-depth-btn"
              >
                <Download className="h-3 w-3 stroke-[2.5]" />
                Download
              </Link>

              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={toggle}
                  className="p-2.5 rounded-none border-2 border-[var(--border)] neo-depth-btn text-[var(--foreground)] cursor-pointer"
                  aria-label={`Current theme: ${theme}. Click to change.`}
                  title={`Theme: ${theme}`}
                >
                  {theme === 'dark' ? (
                    <Moon className="h-4 w-4" strokeWidth={2.5} />
                  ) : theme === 'light' ? (
                    <Sun className="h-4 w-4" strokeWidth={2.5} />
                  ) : theme === 'sepia' ? (
                    <span className="text-xs font-black">S</span>
                  ) : theme === 'high-contrast' ? (
                    <span className="text-xs font-black">HC</span>
                  ) : theme === 'ocean' ? (
                    <span className="text-xs font-black">🌊</span>
                  ) : (
                    <span className="text-xs font-black">🌙</span>
                  )}
                </button>
              )}

              {/* Mobile search icon */}
              <button
                onClick={() => setSearchOpen(true)}
                className="md:hidden p-2.5 rounded-none border-2 border-[var(--border)] neo-depth-btn text-[var(--foreground)] cursor-pointer"
                aria-label="Search endpoints"
              >
                <Search className="h-4 w-4" strokeWidth={2.5} />
              </button>

              {/* Search Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden md:flex items-center justify-between w-64 lg:w-80 rounded-none bg-[var(--card-bg)] border-2 border-[var(--border)] px-3 py-2.5 text-xs text-[var(--foreground)] font-bold transition-all neo-depth-btn cursor-pointer"
                aria-label="Search endpoints"
              >
                <div className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 stroke-[2.5] text-[var(--muted)]" />
                  <span className="font-mono text-[var(--muted)] text-[11px]">
                    Search everything...
                  </span>
                </div>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded-none border border-[var(--border)] bg-[var(--card-bg)] px-1.5 font-mono text-[10px] font-medium text-[var(--muted)]">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {searchOpen && (
          <SearchPalette onClose={() => setSearchOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function DocsProgress() {
  const [count, setCount] = useState(1);
  const TOTAL = 106;

  useEffect(() => {
    const update = () => {
      try {
        const raw = localStorage.getItem('gnovium-viewed');
        if (raw) setCount(JSON.parse(raw).length);
      } catch {}
    };
    update();
    window.addEventListener('storage', update);
    const id = setInterval(update, 2000);
    return () => { window.removeEventListener('storage', update); clearInterval(id); };
  }, []);

  const pct = Math.round((count / TOTAL) * 100);

  return (
    <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[var(--muted)]">
      <span>{count}/{TOTAL}</span>
      <div className="w-14 h-1.5 bg-[var(--border)] overflow-hidden">
        <div className="h-full bg-[var(--foreground)] transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
