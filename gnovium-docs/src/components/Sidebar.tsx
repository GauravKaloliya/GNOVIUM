'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Shield, Gauge, GitBranch, AlertTriangle, Globe, PanelLeftClose } from 'lucide-react';
import { Endpoint } from '@/data';
import { getModuleIcon } from '@/data/icons';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const GUIDE_ITEMS: NavItem[] = [
  { id: 'auth-guide', label: 'Authentication Guide', icon: <Shield className="h-3 w-3" /> },
  { id: 'rate-limits', label: 'Rate Limits & Backoff', icon: <Gauge className="h-3 w-3" /> },
  { id: 'cors-config', label: 'CORS Configuration', icon: <Globe className="h-3 w-3" /> },
  { id: 'api-versioning', label: 'API Versioning & Migration', icon: <GitBranch className="h-3 w-3" /> },
];

interface SidebarProps {
  endpoints: Endpoint[];
  activeId: string;
  onSelect: (id: string) => void;
  activeGuideId: string;
  onGuideSelect: (id: string) => void;
  filterMethod?: string;
  viewedEndpoints: Set<string>;
  zenMode: boolean;
  onToggleZenMode: () => void;
}

export default function Sidebar({ endpoints, activeId, onSelect, activeGuideId, onGuideSelect, filterMethod, viewedEndpoints, zenMode, onToggleZenMode }: SidebarProps) {
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

  const totalCount = endpoints.length;
  const exploredCount = viewedEndpoints.size;

  return (
    <aside className="w-full h-full flex flex-col gap-6 select-none font-mono overflow-y-auto" role="region" aria-label="Documentation navigation">
      {/* Toggle sidebar button */}
      <div className="flex items-center justify-end px-3 pt-1">
        <button
          onClick={onToggleZenMode}
          className="p-1.5 border-2 border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] transition-all cursor-pointer neo-depth-btn"
          aria-label={zenMode ? 'Show sidebar' : 'Hide sidebar'}
          title={zenMode ? 'Show sidebar' : 'Hide sidebar'}
        >
          <PanelLeftClose className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress indicator */}
      <div className="px-3">
        <div className="flex items-center justify-between text-[10px] font-bold font-mono text-[var(--muted)] mb-1.5">
          <span>EXPLORED</span>
          <span>{exploredCount}/{totalCount} endpoints</span>
        </div>
        <div className="w-full h-1.5 bg-[var(--border)] relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-[var(--foreground)] transition-all duration-500 ease-out"
            style={{ width: `${Math.round((exploredCount / totalCount) * 100)}%` }}
          />
        </div>
      </div>

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

      {/* Guides section */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--muted)] px-3 mb-3 border-b-2 border-[var(--border)] pb-2">Guides</h3>
        <div className="space-y-0.5">
          {GUIDE_ITEMS.map((item) => {
            const isActive = activeGuideId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onGuideSelect(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-none text-left text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--card-bg)] border-l-3 border-[var(--sidebar-active)] text-[var(--foreground)] font-bold'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)] border-l-3 border-transparent'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* External links */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--muted)] px-3 mb-3 border-b-2 border-[var(--border)] pb-2">More</h3>
        <div className="space-y-0.5">
          <a
            href="/error-catalog"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-none text-left text-xs transition-all cursor-pointer text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)] border-l-3 border-transparent"
          >
            <AlertTriangle className="h-3 w-3" />
            <span>Error Catalog</span>
          </a>
          <a
            href="/changelog"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-none text-left text-xs transition-all cursor-pointer text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)] border-l-3 border-transparent"
          >
            <GitBranch className="h-3 w-3" />
            <span>Changelog</span>
          </a>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--muted)] px-3 mb-4 border-b-2 border-[var(--border)] pb-2">API Resources</h3>
        <div className="space-y-2">
          {Object.entries(modules).map(([moduleName, moduleEndpoints]) => {
            const isCollapsed = collapsed[moduleName];
            const seenCount = moduleEndpoints.filter(ep => viewedEndpoints.has(ep.id)).length;
            return (
              <div key={moduleName} className="space-y-1">
                <button
                  onClick={() => toggleModule(moduleName)}
                  className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-[var(--muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)] transition-colors"
                  aria-expanded={!isCollapsed}
                  aria-label={`${moduleName} module with ${moduleEndpoints.length} endpoints`}
                >
                  {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {getModuleIcon(moduleName)}
                  {moduleName}
                  <span className="text-[9px] ml-auto opacity-50 flex items-center gap-1">
                    <span className={seenCount === moduleEndpoints.length ? 'text-emerald-400' : ''}>{seenCount}</span>/{moduleEndpoints.length}
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {moduleEndpoints.map((ep) => {
                      const isActive = activeId === ep.id;
                      const isViewed = viewedEndpoints.has(ep.id);
                      return (
                        <button
                          key={ep.id}
                          onClick={() => onSelect(ep.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-none text-left text-xs transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[var(--card-bg)] border-l-3 border-[var(--sidebar-active)] text-[var(--foreground)] font-bold'
                              : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)] border-l-3 border-transparent'
                          } ${isViewed && !isActive ? 'opacity-80' : ''}`}
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
