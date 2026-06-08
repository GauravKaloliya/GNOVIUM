'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, FileText, ArrowRight, X } from 'lucide-react';
import { ENDPOINTS, Endpoint } from '@/data/endpoints';

interface SearchPaletteProps {
  onClose: () => void;
}

export default function SearchPalette({ onClose }: SearchPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Endpoint[]>(ENDPOINTS);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filter endpoints dynamically
  useEffect(() => {
    if (!query.trim()) {
      setResults(ENDPOINTS);
      setSelectedIndex(0);
      return;
    }
    const filtered = ENDPOINTS.filter(
      (ep) =>
        ep.path.toLowerCase().includes(query.toLowerCase()) ||
        ep.summary.toLowerCase().includes(query.toLowerCase()) ||
        ep.module.toLowerCase().includes(query.toLowerCase()) ||
        ep.description.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation (Arrows & Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        selectEndpoint(results[selectedIndex].id);
      }
    }
  };

  const selectEndpoint = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', `/?endpoint=${id}`);
      window.dispatchEvent(new Event('popstate'));
    } else {
      router.push(`/?endpoint=${id}`);
    }
    onClose();
  };

  const methodColors = {
    GET: 'text-zinc-100 bg-white/5 border-white/20',
    POST: 'text-zinc-100 bg-white/5 border-white/20',
    PATCH: 'text-zinc-100 bg-white/5 border-white/20',
    DELETE: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.2 }}
        className="z-10 w-full max-w-2xl overflow-hidden rounded-none border-[3px] border-white bg-zinc-950 shadow-[8px_8px_0px_0px_#27272a]"
      >
        {/* Input bar */}
        <div className="relative flex items-center border-b-2 border-white/10 px-4">
          <Search className="h-5 w-5 text-zinc-400 stroke-[2.5]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search all endpoints, properties, modules..."
            className="h-16 w-full bg-transparent px-3 text-sm text-white outline-none placeholder:text-zinc-600 font-mono font-bold uppercase tracking-wider"
          />
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-none border border-transparent hover:border-white/20 transition-all">
            <X className="h-5 w-5 text-zinc-400 hover:text-white" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[350px] overflow-y-auto p-3 scrollbar-thin space-y-1.5">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
              <FileText className="h-12 w-12 stroke-[1.5] mb-2 text-zinc-700" />
              <p className="text-sm font-bold font-mono uppercase tracking-wider">No matching endpoints found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((ep, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={ep.id}
                    onClick={() => selectEndpoint(ep.id)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-none text-left transition-all ${
                      isSelected
                        ? 'bg-zinc-900 border-2 border-white text-white neo-depth-btn'
                        : 'border-2 border-transparent text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-none border-2 ${methodColors[ep.method]}`}>
                        {ep.method}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">{ep.module}</span>
                          <span className="text-xs text-zinc-100 font-mono truncate">{ep.path}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 truncate font-mono">{ep.summary}</p>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="flex items-center gap-1.5 text-xs text-white font-bold animate-pulse font-mono uppercase tracking-widest">
                        <span>Go</span>
                        <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between border-t-2 border-white/10 bg-zinc-950 px-4 py-3 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-4 font-mono">
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 rounded-none border-2 border-white/20 bg-zinc-900 text-white">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 rounded-none border-2 border-white/20 bg-zinc-900 text-white">Enter</kbd> Select
            </span>
          </div>
          <span className="flex items-center gap-1.5 font-mono">
            <kbd className="px-2 py-0.5 rounded-none border-2 border-white/20 bg-zinc-900 text-white">Esc</kbd> Close
          </span>
        </div>
      </motion.div>
    </div>
  );
}
