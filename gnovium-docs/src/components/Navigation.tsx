'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Search, Command } from 'lucide-react';
import SearchPalette from '@/components/SearchPalette';

export default function Navigation() {
  const [searchOpen, setSearchOpen] = useState(false);

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
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">

            {/* Left - Logo */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative h-10 w-10 overflow-hidden rounded-none border-2 border-white bg-zinc-900 shadow-[3px_3px_0px_0px_#ffffff] transition-all group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-none">
                  <Image
                    src="/logo/gnovium.jpeg"
                    alt="Gnovium logo"
                    fill
                    sizes="40px"
                    className="object-cover"
                    priority
                  />
                </div>
                <span className="text-sm font-black tracking-widest text-white transition-colors group-hover:text-zinc-300 uppercase font-mono">
                  GNOVIUM <span className="text-[9px] font-black px-2 py-0.5 rounded-none bg-white text-zinc-950 border-2 border-white ml-1 tracking-normal font-sans">DOCS</span>
                </span>
              </Link>
            </div>

            {/* Center - Creator Credit (Footer Font Style) */}
            <div className="hidden md:flex items-center justify-center">
              <div className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-3">
                <span className="opacity-70">CREATED BY</span>
                <a
                  href="https://www.linkedin.com/in/gauravkaloliya225"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors border-b border-white/30 hover:border-white pb-px"
                >
                  GAURAV KALOLIYA
                </a>

                <span className="opacity-40">•</span>

                <a
                  href="https://github.com/GauravKaloliya/gnovium"   
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1.5 group"
                >
                  GITHUB
                  <span className="text-xs opacity-60 group-hover:opacity-100">↗</span>
                </a>
              </div>
            </div>

            {/* Right - Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-between w-80 lg:w-96 rounded-none bg-zinc-950 px-4 py-2.5 text-xs text-white font-bold transition-all neo-depth-btn cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Search className="h-3.5 w-3.5 stroke-[2.5]" />
                <span className="font-mono uppercase tracking-wider text-zinc-400">
                  Search endpoints...
                </span>
              </div>

              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded-none border border-white/20 bg-zinc-900 px-1.5 font-mono text-[9px] font-medium text-zinc-400">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </button>
          </div>
        </div>
      </header>

      {/* Global Search Palette */}
      <AnimatePresence>
        {searchOpen && (
          <SearchPalette onClose={() => setSearchOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}