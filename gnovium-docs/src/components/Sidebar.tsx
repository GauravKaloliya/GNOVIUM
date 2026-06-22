'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Endpoint } from '@/data';

interface SidebarProps {
  endpoints: Endpoint[];
  activeId: string;
  onSelect: (id: string) => void;
  filterMethod?: string;
}

export default function Sidebar({ endpoints, activeId, onSelect, filterMethod }: SidebarProps) {
  const filtered = filterMethod
    ? endpoints.filter((ep) => ep.method === filterMethod)
    : endpoints;

  const modules = filtered.reduce((acc, ep) => {
    if (!acc[ep.module]) acc[ep.module] = [];
    acc[ep.module].push(ep);
    return acc;
  }, {} as Record<string, Endpoint[]>);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleModule = (name: string) => {
    setCollapsed((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const methodBadge = (method: string) => {
    const cls = method === 'GET' ? 'method-get' : method === 'POST' ? 'method-post' : method === 'PATCH' ? 'method-patch' : 'method-delete';
    return `text-[9px] font-black px-1.5 py-0.5 border-2 ${cls} rounded-none w-10 text-center`;
  };

  return (
    <aside className="w-full flex flex-col gap-6 select-none font-mono" role="navigation" aria-label="API endpoint navigation">
      {/* Quickstart link */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--muted)] px-3 mb-3 border-b-2 border-[var(--border)] pb-2">Getting Started</h3>
        <button
          onClick={() => {
            const el = document.getElementById('quickstart-guide');
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-none text-left text-xs transition-all cursor-pointer ${
            activeId === 'quickstart-guide'
              ? 'bg-[var(--card-bg)] border-2 border-[var(--sidebar-active)] text-[var(--foreground)] neo-depth-btn font-bold'
              : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)] border border-transparent'
          }`}
          aria-label="Jump to MVP Quickstart guide"
        >
          <span className="text-[9px] font-black px-1.5 py-0.5 border-2 border-[var(--border)] rounded-none w-10 text-center">⚡</span>
          <span>MVP Quickstart</span>
        </button>
      </div>

      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--muted)] px-3 mb-4 border-b-2 border-[var(--border)] pb-2">API Resources</h3>
        <div className="space-y-2">
          {Object.entries(modules).map(([moduleName, moduleEndpoints]) => {
            const isCollapsed = collapsed[moduleName];
            return (
              <div key={moduleName} className="space-y-1">
                <button
                  onClick={() => toggleModule(moduleName)}
                  className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-[var(--muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)] transition-colors"
                  aria-expanded={!isCollapsed}
                  aria-label={`${moduleName} module with ${moduleEndpoints.length} endpoints`}
                >
                  {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {moduleName}
                  <span className="text-[9px] ml-auto opacity-50">{moduleEndpoints.length}</span>
                </button>
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {moduleEndpoints.map((ep) => {
                      const isActive = activeId === ep.id;
                      return (
                        <button
                          key={ep.id}
                          onClick={() => onSelect(ep.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-none text-left text-xs transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[var(--card-bg)] border-l-3 border-[var(--sidebar-active)] text-[var(--foreground)] font-bold'
                              : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)] border-l-3 border-transparent'
                          }`}
                          aria-current={isActive ? 'true' : undefined}
                        >
                          <span className={`w-10 text-center ${methodBadge(ep.method)}`}>
                            {ep.method}
                          </span>
                          <span className="truncate">{ep.path}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
