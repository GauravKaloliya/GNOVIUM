'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Search, Command } from 'lucide-react';
import SearchPalette from '@/components/SearchPalette';

export default function Navigation() {
  const [searchOpen, setSearchOpen] = useState(false);

  // Global CMD+K shortcut listener
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
            {/* Logo */}
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

            {/* Search Trigger Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2.5 rounded-none bg-zinc-950 px-4 py-2.5 text-xs text-white font-bold transition-all neo-depth-btn cursor-pointer"
              >
                <Search className="h-3.5 w-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline font-mono uppercase tracking-wider">Search API...</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded-none border border-white/20 bg-zinc-900 px-1.5 font-mono text-[9px] font-medium text-zinc-400">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Global Search Palette Modal */}
      <AnimatePresence>
        {searchOpen && (
          <SearchPalette onClose={() => setSearchOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
