'use client';

import { Endpoint } from '@/data/endpoints';

interface SidebarProps {
  endpoints: Endpoint[];
  activeId: string;
  onSelect: (id: string) => void;
}

export default function Sidebar({ endpoints, activeId, onSelect }: SidebarProps) {
  // Group endpoints by Module
  const modules = endpoints.reduce((acc, ep) => {
    if (!acc[ep.module]) acc[ep.module] = [];
    acc[ep.module].push(ep);
    return acc;
  }, {} as Record<string, Endpoint[]>);

  const methodBadges = {
    GET: 'text-[9px] font-black px-1.5 py-0.5 rounded-none bg-white/5 text-zinc-300 border-2 border-white/25',
    POST: 'text-[9px] font-black px-1.5 py-0.5 rounded-none bg-white/5 text-zinc-300 border-2 border-white/25',
    PATCH: 'text-[9px] font-black px-1.5 py-0.5 rounded-none bg-white/5 text-zinc-300 border-2 border-white/25',
    DELETE: 'text-[9px] font-black px-1.5 py-0.5 rounded-none bg-rose-500/10 text-rose-400 border-2 border-rose-500/30',
  };

  return (
    <aside className="w-full flex flex-col gap-6 select-none font-mono">
      {/* Quickstart link */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 px-3 mb-3 border-b-2 border-zinc-800 pb-2">Getting Started</h3>
        <button
          onClick={() => {
            const el = document.getElementById('quickstart-guide');
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-none text-left text-xs transition-all cursor-pointer ${
            activeId === 'quickstart-guide'
              ? 'bg-zinc-900 border-2 border-white text-white neo-depth-btn font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-none bg-white/10 text-zinc-200 border-2 border-white/25 w-10 text-center">⚡</span>
          <span>MVP Quickstart</span>
        </button>
      </div>

      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 px-3 mb-4 border-b-2 border-zinc-800 pb-2">API Resources</h3>
        <div className="space-y-4">
          {Object.entries(modules).map(([moduleName, moduleEndpoints]) => (
            <div key={moduleName} className="space-y-2">
              <span className="text-xs font-black text-zinc-400 px-3 uppercase tracking-wider">{moduleName}</span>
              <div className="space-y-1">
                {moduleEndpoints.map((ep) => {
                  const isActive = activeId === ep.id;
                  return (
                    <button
                      key={ep.id}
                      onClick={() => onSelect(ep.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-none text-left text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-zinc-900 border-2 border-white text-white neo-depth-btn font-bold'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <span className={`w-10 text-center scale-90 ${methodBadges[ep.method]}`}>
                        {ep.method}
                      </span>
                      <span className="truncate">{ep.path}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
