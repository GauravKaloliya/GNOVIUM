'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Highlight, themes } from 'prism-react-renderer';
import {
  Terminal, Copy, Check, Info, ListCollapse, Link as LinkIcon,
  ChevronDown, ChevronRight, Clock, ArrowUpDown, X, Play,
  BookOpen, WrapText, Code2, RefreshCw, Layers, Star,
  ExternalLink,
} from 'lucide-react';
import PageWrapper from '@/components/PageWrapper';
import Sidebar from '@/components/Sidebar';
import { ENDPOINTS, Endpoint } from '@/data';
import Footer from '@/components/Footer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useTheme } from '@/components/ThemeProvider';
import Tooltip from '@/components/Tooltip';
import SchemaTree from '@/components/SchemaTree';
import ApiPlayground from '@/components/ApiPlayground';
import Image from 'next/image';

const API_BASE_URL = 'https://api.gnovium.com/api/v1';
const METHOD_ORDER = ['GET', 'POST', 'PATCH', 'DELETE'] as const;
const ALL_MODULES = [...new Set(ENDPOINTS.map((ep) => ep.module))].sort();

interface ApiVersion {
  label: string;
  description: string;
  date: string;
  changes: string[];
}

const API_VERSIONS: ApiVersion[] = [
  {
    label: 'v1.0.0',
    description: 'Initial release',
    date: '2026-06',
    changes: [
      '106 endpoints across 24 modules',
      'Auth, Workspaces, Entities, Blocks, Relations, Tags',
      'Graph query, traversal, pathfinding',
      'Versioning, branches, visual diffs',
      'AI semantic search with Ollama integration',
      'Governance, audit logs, dashboard analytics',
      'File upload, sync, notifications, jobs, backups',
    ],
  },
  {
    label: 'v1.1.0',
    description: 'Beta — current',
    date: '2026-07',
    changes: [
      'All v1.0.0 features',
      'Cloud mode (NeonDB + S3 + Redis)',
      'Local mode with SQLite + SimpleCache',
      'GNOVIUM_MODE env var configuration',
      'Modular API docs site',
    ],
  },
];

const USE_CASE_GUIDES = [
  {
    id: 'personal-kb',
    title: 'Build a Personal Knowledge Base',
    description: 'Create a local-first knowledge graph for research, notes, and learning.',
    steps: [
      'Set GNOVIUM_MODE=local and start the server',
      `Register a user: POST /api/v1/auth/register`,
      'Create a workspace with your name',
      'Create entity types: "Note", "Book", "Idea"',
      'Add entities and connect with typed relations',
      'Use AI search to query your knowledge base',
      'Create branches for different research topics',
      'Merge and diff changes between branches',
    ],
    code: `GNOVIUM_MODE=local python -m app.run

curl -X POST http://localhost:5000/api/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"me@example.com","password":"secure-pass"}'

curl -X POST http://localhost:5000/api/v1/entities/ \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{"workspace_id":"<WS>","title":"Research Notes","entity_type_id":"<TYPE>"}'`,
  },
  {
    id: 'team-collab',
    title: 'Team Collaboration with Cloud Sync',
    description: 'Share a workspace across your team with cloud infrastructure.',
    steps: [
      'Set GNOVIUM_MODE=cloud with NeonDB and S3 configured',
      'Register team members',
      'Create a shared workspace',
      'Set governance policies for write access',
      'Collaborate on entities with real-time sync',
      'Review changes via version diffs',
      'Schedule automated backups',
      'Monitor activity via the dashboard',
    ],
    code: `GNOVIUM_MODE=cloud docker compose up -d

# Create workspace
curl -X POST https://api.gnovium.com/api/v1/workspaces/ \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{"name":"Team KB","description":"Shared team knowledge"}'`,
  },
  {
    id: 'graph-app',
    title: 'Build a Graph-Powered Application',
    description: 'Leverage the knowledge graph API for connected data applications.',
    steps: [
      'Model your domain with entity types and relation types',
      'Create entities with properties and tags',
      'Connect entities with semantic relations',
      'Query the graph: traverse, find paths, filter by type',
      'Use the AI endpoint for natural language queries',
      'Visualize graph connections via the graph API',
      'Track changes with versioning and branches',
      'Export data via the sync API',
    ],
    code: `# Query graph
curl -X POST https://api.gnovium.com/api/v1/graph/query \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{"workspace_id":"<WS>","filters":{"entity_type":"Note"}}'

# Find path between nodes
curl -X POST https://api.gnovium.com/api/v1/graph/paths \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{"workspace_id":"<WS>","source_entity_id":"<A>","target_entity_id":"<B>"}'`,
  },
];

function CodeBlock({ code, language, maxHeight = '200px', id }: { code: string; language: string; maxHeight?: string; id?: string }) {
  const [wrapped, setWrapped] = useState(false);
  const { theme } = useTheme();
  const prismTheme = theme === 'dark' ? themes.oneDark : themes.oneLight;

  return (
    <div className="relative">
      <button
        onClick={() => setWrapped(!wrapped)}
        className="absolute top-2 right-2 p-1 border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer z-10 bg-[var(--card-bg)]"
        aria-label={wrapped ? 'Disable word wrap' : 'Enable word wrap'}
        title={wrapped ? 'Disable word wrap' : 'Enable word wrap'}
      >
        <WrapText className={`h-3 w-3 ${wrapped ? 'text-[var(--foreground)]' : ''}`} />
      </button>
      <Highlight code={code.trimEnd()} language={language} theme={prismTheme}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`p-4 font-mono text-[11px] overflow-x-auto leading-relaxed m-0 ${wrapped ? 'code-wrap' : ''}`}
            style={{ maxHeight, background: 'transparent' }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })} className="table-row">
                <span className="table-cell text-right pr-4 select-none opacity-30 text-[10px] w-8">
                  {i + 1}
                </span>
                <span className="table-cell">
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </span>
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}

const STATUS_CODES: Record<string, { code: string; description: string }[]> = {
  GET: [
    { code: '200', description: 'Success' },
    { code: '404', description: 'Not found' },
    { code: '400', description: 'Bad request' },
    { code: '401', description: 'Unauthorized' },
  ],
  POST: [
    { code: '201', description: 'Created' },
    { code: '400', description: 'Bad request' },
    { code: '401', description: 'Unauthorized' },
    { code: '409', description: 'Conflict' },
  ],
  PATCH: [
    { code: '200', description: 'Success' },
    { code: '404', description: 'Not found' },
    { code: '400', description: 'Bad request' },
    { code: '401', description: 'Unauthorized' },
    { code: '409', description: 'Conflict' },
  ],
  DELETE: [
    { code: '200', description: 'Deleted' },
    { code: '404', description: 'Not found' },
    { code: '401', description: 'Unauthorized' },
    { code: '409', description: 'Conflict' },
  ],
};

const ESTIMATED_TIMES: Record<string, string> = {
  GET: '<30ms',
  POST: '<80ms',
  PATCH: '<50ms',
  DELETE: '<50ms',
};

const METHOD_COLORS: Record<string, string> = {
  GET: 'method-get', POST: 'method-post', PATCH: 'method-patch', DELETE: 'method-delete',
};

const LANGS = ['curl', 'js', 'python', 'typescript'] as const;
const LANG_MAP: Record<string, string> = { curl: 'bash', js: 'javascript', python: 'python', typescript: 'typescript' };

function methodBadge(method: string) {
  const cls = METHOD_COLORS[method] || 'method-get';
  return (
    <span className={`text-[10px] font-black px-2.5 py-0.5 border-2 ${cls} rounded-none`}>
      {method}
    </span>
  );
}

function DocsContent() {
  const searchParams = useSearchParams();
  const { theme } = useTheme();

  const [activeEndpointId, setActiveEndpointId] = useState(ENDPOINTS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTabs, setActiveTabs] = useState<Record<string, 'curl' | 'js' | 'python' | 'typescript'>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filterMethod, setFilterMethod] = useState<string | null>(null);
  const [filterModule, setFilterModule] = useState<string | null>(null);
  const [sortAlpha, setSortAlpha] = useState(false);
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [apiVersion, setApiVersion] = useState(API_VERSIONS[API_VERSIONS.length - 1].label);
  const [showVersionInfo, setShowVersionInfo] = useState(false);
  const [responseView, setResponseView] = useState<'raw' | 'tree'>('raw');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  // Load recently viewed
  useEffect(() => {
    try {
      const stored = localStorage.getItem('gnovium-recent');
      if (stored) setRecentlyViewed(JSON.parse(stored));
    } catch {}
  }, []);

  const addRecent = useCallback((id: string) => {
    setRecentlyViewed((prev) => {
      const next = [id, ...prev.filter((p) => p !== id)].slice(0, 5);
      try { localStorage.setItem('gnovium-recent', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // Deep link
  useEffect(() => {
    const endpointId = searchParams.get('endpoint');
    if (endpointId) {
      const ep = ENDPOINTS.find((e) => e.id === endpointId);
      if (ep) {
        setActiveEndpointId(endpointId);
        addRecent(endpointId);
        setTimeout(() => {
          document.getElementById(endpointId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [searchParams, addRecent]);

  // Filter + sort
  const filteredEndpoints = useMemo(() => {
    let result = [...ENDPOINTS];
    if (filterMethod) result = result.filter((ep) => ep.method === filterMethod);
    if (filterModule) result = result.filter((ep) => ep.module === filterModule);
    if (sortAlpha) result.sort((a, b) => a.path.localeCompare(b.path));
    return result;
  }, [filterMethod, filterModule, sortAlpha]);

  const modules = useMemo(() => {
    const grouped: Record<string, Endpoint[]> = {};
    filteredEndpoints.forEach((ep) => {
      if (!grouped[ep.module]) grouped[ep.module] = [];
      grouped[ep.module].push(ep);
    });
    return grouped;
  }, [filteredEndpoints]);

  useEffect(() => {
    setCollapsedModules((prev) => {
      const next: Record<string, boolean> = {};
      Object.keys(modules).forEach((m) => { next[m] = prev[m] ?? true; });
      return next;
    });
  }, [filterMethod, filterModule]);

  const toggleModule = (name: string) => {
    setCollapsedModules((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSelect = (id: string) => {
    setActiveEndpointId(id);
    addRecent(id);
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.pushState(null, '', `?endpoint=${id}`);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSnippet = (endpoint: Endpoint, lang: 'curl' | 'js' | 'python' | 'typescript') => {
    const url = `${API_BASE_URL}${endpoint.path}`;
    const headers = endpoint.headers || {
      'Content-Type': 'application/json',
      ...(endpoint.id.startsWith('auth') ? {} : { Authorization: 'Bearer $ACCESS_TOKEN' }),
    };

    if (lang === 'curl') {
      const headerStr = Object.entries(headers).map(([k, v]) => `-H "${k}: ${v}"`).join(' \\\n  ');
      const bodyStr = endpoint.requestBody ? ` \\\n  -d '${endpoint.requestBody.replace(/\n\s*/g, '')}'` : '';
      return `curl -X ${endpoint.method} ${url} \\\n  ${headerStr}${bodyStr}`;
    }
    if (lang === 'js') {
      const opts: Record<string, unknown> = { method: endpoint.method, headers };
      if (endpoint.requestBody) { try { opts.body = JSON.parse(endpoint.requestBody); } catch { opts.body = endpoint.requestBody; } }
      return `fetch("${url}", ${JSON.stringify(opts, null, 2)});`;
    }
    if (lang === 'python') {
      const reqHeaders = JSON.stringify(headers, null, 2);
      let reqData = '';
      if (endpoint.requestBody) {
        try { reqData = `, json=${JSON.stringify(JSON.parse(endpoint.requestBody), null, 2)}`; }
        catch { reqData = `, data='''${endpoint.requestBody}'''`; }
      }
      return `import requests\n\nresponse = requests.${endpoint.method.toLowerCase()}(\n    "${url}",\n    headers=${reqHeaders}${reqData}\n)\nprint(response.json())`;
    }
    if (lang === 'typescript') {
      const opts: Record<string, unknown> = { method: endpoint.method, headers };
      if (endpoint.requestBody) { try { opts.body = JSON.parse(endpoint.requestBody); } catch { opts.body = endpoint.requestBody; } }
      return `const response = await fetch("${url}", ${JSON.stringify(opts, null, 2)});\nconst data = await response.json();`;
    }
    return '';
  };

  // Keyboard shortcuts for tabs
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '1') {
        setActiveTabs((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((k) => { next[k] = 'curl'; });
          return next;
        });
      }
      if (e.key === '2') {
        setActiveTabs((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((k) => { next[k] = 'js'; });
          return next;
        });
      }
      if (e.key === '3') {
        setActiveTabs((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((k) => { next[k] = 'python'; });
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Autocomplete search suggestions
  const autocompleteResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return ENDPOINTS.filter(
      (ep) =>
        ep.path.toLowerCase().includes(q) ||
        ep.summary.toLowerCase().includes(q) ||
        ep.module.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [searchQuery]);

  const activeEndpoint = ENDPOINTS.find((ep) => ep.id === activeEndpointId);

  return (
    <div className="flex flex-col lg:flex-row gap-8 relative items-start" id="main-content">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 shrink-0 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 scrollbar-thin">
        <Sidebar
          endpoints={filterMethod ? ENDPOINTS.filter((ep) => ep.method === filterMethod) : ENDPOINTS}
          activeId={activeEndpointId}
          onSelect={handleSelect}
          filterMethod={filterMethod || undefined}
        />
      </div>

      <div className="flex-1 w-full space-y-8">
        {/* ── Header ──────────────────────────────── */}
        <div className="p-6 sm:p-8 rounded-none border-[3px] border-[var(--foreground)] neo-depth flex flex-col md:flex-row items-center justify-between gap-8 mb-6 overflow-hidden">
          <div className="space-y-4 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-none border-2 border-[var(--foreground)] bg-[var(--card-bg)] text-[10px] font-black tracking-widest uppercase font-mono neo-depth-btn">
              GNOVIUM API v1.0.0
            </div>
            <h1 className="display-heading text-2xl sm:text-3xl tracking-tight text-[var(--foreground)] uppercase">
              API Documentation
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed font-mono font-bold">
              Gnovium API is a local-first Knowledge Operating System API for building applications where knowledge behaves like a living system rather than a collection of disconnected documents.
            </p>
            <div className="flex flex-wrap gap-3 pt-2 font-mono text-[10px] font-bold">
              <span className="px-2.5 py-1 border-2 border-[var(--border)] text-[var(--muted)] bg-[var(--card-bg)]">HOST: https://api.gnovium.com/api/v1</span>
              <span className="px-2.5 py-1 border-2 border-[var(--border)] text-[var(--muted)] bg-[var(--card-bg)]">VERSION: {apiVersion}</span>
            </div>
          </div>

          <div className="iso-perspective hidden sm:flex items-center justify-center p-4 mr-6">
            <motion.div
              className="iso-assembly"
              initial={{ rotateX: 55, rotateZ: -40 }}
              animate={{ rotateX: 55, rotateZ: -40 }}
              whileHover={{ rotateX: 65, rotateZ: -50, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 80, damping: 12 }}
            >
              {[
                { label: 'CORE SERVICES', z: 0, cls: '' },
                { label: 'ROUTING GATEWAY', z: 70, cls: 'text-[var(--muted)]' },
                { label: 'API DOCUMENTATION', z: 140, cls: '' },
              ].map((layer) => (
                <motion.div
                  key={layer.label}
                  className="iso-layer"
                  style={{ transformStyle: 'preserve-3d' }}
                  initial={false}
                  animate={{ translateZ: layer.z, opacity: undefined }}
                  whileHover={{
                    translateZ: layer.z + 60,
                    transition: { type: 'spring', stiffness: 150, damping: 15 },
                  }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20, mass: 0.5 }}
                >
                  <span className="text-[8px] font-bold text-[var(--muted)] font-mono mb-1">LAYER 03</span>
                  <span className={`text-[10px] font-black tracking-wider uppercase ${layer.cls}`}>{layer.label}</span>
                  <motion.div className="mt-2 h-1.5 w-8 bg-[var(--foreground)]" layoutId="layer-bar" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* ── Founder Profile Hero Card ────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 120, damping: 18 }}
          className="border-2 border-[var(--border)] bg-[var(--card-bg)] p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5"
        >
          {/* Founder Avatar */}
          <div className="w-16 h-16 border-[3px] border-[var(--foreground)] bg-[var(--code-bg)] flex items-center justify-center shrink-0 neo-depth-btn overflow-hidden">
            <Image
              src="/images/Gaurav Kaloliya.jpeg"
              alt="Gaurav Kaloliya"
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          </div>

          {/* Founder Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <span className="text-[9px] font-black font-mono uppercase tracking-[0.2em] text-[var(--muted)]">Created By</span>
              <span className="text-base font-black font-mono text-[var(--foreground)] tracking-tight">GAURAV KALOLIYA</span>
              <span className="px-2 py-0.5 border border-[var(--border)] text-[9px] font-black font-mono uppercase tracking-wider text-[var(--muted)]">Founder &amp; Creator</span>
            </div>
            <blockquote className="text-xs text-[var(--muted)] font-mono italic leading-relaxed border-l-2 border-[var(--border)] pl-3">
              &ldquo;Gnovium was born from a simple belief — that knowledge should behave like a living system, not a graveyard of documents. Every feature, every endpoint, every line of code was built to make that vision real.&rdquo;
            </blockquote>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://www.linkedin.com/in/gaurav-kaloliya-b44569417"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-black font-mono uppercase tracking-wider px-3 py-1.5 border-2 border-[var(--border)] neo-depth-btn text-[var(--foreground)] hover:bg-[var(--code-bg)] transition-all flex items-center gap-1.5"
            >
              <ExternalLink className="h-3 w-3" /> LinkedIn
            </a>
            <a
              href="https://github.com/GauravKaloliya/gnovium"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-black font-mono uppercase tracking-wider px-3 py-1.5 border-2 border-[var(--border)] neo-depth-btn text-[var(--foreground)] hover:bg-[var(--code-bg)] transition-all flex items-center gap-1.5"
            >
              <Star className="h-3 w-3" /> GitHub
            </a>
          </div>
        </motion.div>

        {/* ── Search / Version / Filter Bar ────────── */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-2 border-[var(--border)] bg-[var(--card-bg)]">
          {/* Search with autocomplete */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearchSuggestions(true); }}
              onFocus={() => setShowSearchSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
              placeholder="Search endpoints..."
              className="w-full border-2 border-[var(--border)] bg-[var(--code-bg)] px-3 py-1.5 text-[11px] font-mono text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
              aria-label="Search endpoints"
            />
            {showSearchSuggestions && autocompleteResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 border-2 border-[var(--border)] bg-[var(--card-bg)] z-20 mt-1 shadow-lg">
                {autocompleteResults.map((ep) => (
                  <button
                    key={ep.id}
                    onMouseDown={() => { handleSelect(ep.id); setSearchQuery(''); setShowSearchSuggestions(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-[11px] font-mono hover:bg-[var(--code-bg)] text-[var(--foreground)] cursor-pointer"
                  >
                    {methodBadge(ep.method)}
                    <span className="truncate">{ep.path}</span>
                    <span className="ml-auto text-[var(--muted)] text-[9px] uppercase tracking-wider">{ep.module}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Version selector */}
          <div className="relative">
            <button
              onClick={() => setShowVersionInfo(!showVersionInfo)}
              className="text-[10px] font-black font-mono uppercase tracking-wider px-3 py-1.5 border-2 border-[var(--border)] neo-depth-btn text-[var(--foreground)] cursor-pointer flex items-center gap-1.5"
            >
              <Layers className="h-3 w-3" /> {apiVersion}
            </button>
            {showVersionInfo && (
              <div className="absolute top-full right-0 border-2 border-[var(--border)] bg-[var(--card-bg)] z-20 mt-1 w-72 shadow-lg">
                {API_VERSIONS.map((v) => (
                  <button
                    key={v.label}
                    onClick={() => { setApiVersion(v.label); setShowVersionInfo(false); }}
                    className={`w-full text-left px-4 py-3 border-b border-[var(--border)] last:border-b-0 cursor-pointer hover:bg-[var(--code-bg)] ${
                      apiVersion === v.label ? 'bg-[var(--code-bg)]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black font-mono text-[var(--foreground)]">{v.label}</span>
                      <span className="text-[9px] font-mono text-[var(--muted)]">{v.date}</span>
                      {v === API_VERSIONS[API_VERSIONS.length - 1] && (
                        <span className="text-[8px] font-black px-1.5 py-0.5 bg-[var(--foreground)] text-[var(--background)] font-mono ml-auto">LATEST</span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-[var(--muted)] mt-0.5">{v.description}</p>
                    <div className="mt-1.5 space-y-0.5">
                      {v.changes.map((c, i) => (
                        <div key={i} className="changelog-entry text-[9px] font-mono text-[var(--muted)]">{c}</div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-[10px] font-mono text-[var(--muted)]">{filteredEndpoints.length} / {ENDPOINTS.length}</span>
        </div>

        {/* ── Filters row ──────────────────────────── */}
        <div className={`flex flex-wrap items-center gap-2 ${showFilters ? '' : 'hidden'}`}>
          {METHOD_ORDER.map((m) => (
            <button
              key={m}
              onClick={() => setFilterMethod(filterMethod === m ? null : m)}
              className={`text-[10px] font-black px-2.5 py-1 border-2 rounded-none cursor-pointer transition-all ${
                filterMethod === m
                  ? `${METHOD_COLORS[m]} border-[var(--foreground)] neo-depth-btn`
                  : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--foreground)]'
              }`}
            >
              {m}
            </button>
          ))}
          <div className="w-px h-5 bg-[var(--border)]" />
          <select
            value={filterModule || ''}
            onChange={(e) => setFilterModule(e.target.value || null)}
            className="text-[10px] font-black font-mono uppercase tracking-wider px-3 py-1 border-2 border-[var(--border)] bg-[var(--card-bg)] text-[var(--foreground)] rounded-none cursor-pointer"
          >
            <option value="">All Modules</option>
            {ALL_MODULES.map((m) => (<option key={m} value={m}>{m}</option>))}
          </select>
          <button
            onClick={() => setSortAlpha(!sortAlpha)}
            className={`text-[10px] font-black font-mono uppercase tracking-wider px-3 py-1 border-2 rounded-none cursor-pointer transition-all ${
              sortAlpha ? 'border-[var(--foreground)] neo-depth-btn' : 'border-[var(--border)] text-[var(--muted)]'
            }`}
          >
            A-Z
          </button>
          <button
            onClick={() => setShowFilters(false)}
            className="text-[10px] font-mono text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer ml-auto"
          >
            <X className="h-3 w-3 inline" /> Hide
          </button>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-[10px] font-black font-mono uppercase tracking-wider neo-depth-btn px-3 py-1.5 border-2 border-[var(--foreground)] text-[var(--foreground)] cursor-pointer flex items-center gap-1.5"
        >
          <ArrowUpDown className="h-3 w-3" /> {showFilters ? 'Hide Filters' : 'Filters'}
        </button>

        {/* ── Recently Viewed ──────────────────────── */}
        {recentlyViewed.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            <Clock className="h-3 w-3 text-[var(--muted)]" />
            <span className="text-[var(--muted)] font-black uppercase tracking-wider text-[10px]">Recent:</span>
            {recentlyViewed.map((id) => {
              const ep = ENDPOINTS.find((e) => e.id === id);
              if (!ep) return null;
              return (
                <button
                  key={id}
                  onClick={() => handleSelect(id)}
                  className={`text-[10px] px-2 py-0.5 border border-[var(--border)] font-mono cursor-pointer transition-all ${
                    id === activeEndpointId ? 'border-[var(--foreground)] font-bold' : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {ep.method} {ep.path}
                </button>
              );
            })}
          </div>
        )}

        {/* ── MVP Quickstart ───────────────────────── */}
        <div id="quickstart-guide" className="p-6 sm:p-8 rounded-none border-[3px] border-[var(--foreground)] neo-depth mb-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-none border-2 border-[var(--foreground)] bg-[var(--card-bg)] text-[10px] font-black tracking-widest uppercase font-mono neo-depth-btn mb-2">
            QUICKSTART · MVP FLOWS
          </div>
          <h2 className="display-heading text-lg text-[var(--foreground)] mb-1">Core Developer Flows</h2>
          <p className="text-xs text-[var(--muted)] font-mono leading-relaxed mb-4">
            Step-by-step flows to go from zero to a fully functioning Knowledge OS workspace.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-[var(--border)] bg-[var(--card-bg)] p-6">
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 font-mono mb-2">LOCAL MODE (Default)</div>
              <p className="text-sm text-[var(--muted)] leading-relaxed">Your knowledge stays yours. Run Gnovium entirely on your device with zero setup.</p>
              <div className="mt-3"><code className="bg-[var(--code-bg)] px-2 py-1 text-xs font-mono">GNOVIUM_MODE=local</code></div>
            </div>
            <div className="border-2 border-[var(--border)] bg-[var(--card-bg)] p-6">
              <div className="text-[10px] font-black uppercase tracking-widest text-sky-500 font-mono mb-2">CLOUD MODE</div>
              <p className="text-sm text-[var(--muted)] leading-relaxed">Transform personal knowledge into shared intelligence.</p>
              <div className="mt-3"><code className="bg-[var(--code-bg)] px-2 py-1 text-xs font-mono">GNOVIUM_MODE=cloud</code></div>
            </div>
          </div>

          {[
            { step: '01', title: 'Register & Authenticate', endpoints: 'POST /api/v1/auth/register → POST /api/v1/auth/login', desc: 'Create an account then log in.', code: `curl -X POST https://api.gnovium.com/api/v1/auth/login \\\n  -H "Content-Type: application/json" \\\n  -d '{"email":"admin@gnovium.dev","password":"change-me-123"}'` },
            { step: '02', title: 'Create a Workspace', endpoints: 'POST /api/v1/workspaces/', desc: 'Every entity, block, and graph lives inside a workspace.', code: `curl -X POST https://api.gnovium.com/api/v1/workspaces/ \\\n  -H "Authorization: Bearer $ACCESS_TOKEN" \\\n  -d '{"name":"Knowledge OS","description":"My local knowledge graph"}'` },
            { step: '03', title: 'Create Entity + Blocks', endpoints: 'POST /api/v1/entities/ → POST /api/v1/blocks/', desc: 'Create a page entity, then append content blocks.', code: `# Create entity\ncurl -X POST https://api.gnovium.com/api/v1/entities/ \\\n  -H "Authorization: Bearer $ACCESS_TOKEN" \\\n  -d '{"workspace_id":"<WS_ID>","title":"Research Notes","entity_type_id":"<TYPE_ID>"}'` },
            { step: '04', title: 'Add Relations', endpoints: 'POST /api/v1/relations/', desc: 'Connect entities with typed edges.', code: `curl -X POST https://api.gnovium.com/api/v1/relations/ \\\n  -H "Authorization: Bearer $ACCESS_TOKEN" \\\n  -d '{"workspace_id":"<WS_ID>","source_entity_id":"<A>","target_entity_id":"<B>","relation_type":"references"}'` },
            { step: '05', title: 'Query the Graph', endpoints: 'POST /api/v1/graph/query · /graph/traverse · /graph/paths', desc: 'Explore the graph.', code: `curl -X POST https://api.gnovium.com/api/v1/graph/traverse \\\n  -H "Authorization: Bearer $ACCESS_TOKEN" \\\n  -d '{"workspace_id":"<WS_ID>","center_node":"<ID>","depth":2}'` },
            { step: '06', title: 'Ask AI', endpoints: 'POST /api/v1/ai/query', desc: 'Submit a natural language question.', code: `curl -X POST https://api.gnovium.com/api/v1/ai/query \\\n  -H "Authorization: Bearer $ACCESS_TOKEN" \\\n  -d '{"workspace_id":"<WS_ID>","question":"Summarize authentication"}'` },
          ].map(({ step, title, endpoints, desc, code }) => (
            <div key={step} className="border-l-[3px] border-[var(--foreground)] pl-6 space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black px-2 py-0.5 bg-[var(--foreground)] text-[var(--background)] font-mono tracking-widest">{step}</span>
                <h3 className="display-heading text-sm text-[var(--foreground)] uppercase tracking-tight">{title}</h3>
              </div>
              <div className="text-[10px] font-mono text-[var(--muted)] tracking-widest uppercase">{endpoints}</div>
              <p className="text-xs text-[var(--muted)] font-mono leading-relaxed">{desc}</p>
              <div className="border-2 border-[var(--border)] bg-[var(--code-bg)] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--card-bg)] border-b-2 border-[var(--border)]">
                  <span className="text-[10px] font-mono text-[var(--muted)] font-bold uppercase">Example</span>
                  <button onClick={() => handleCopy(code, `qs-${step}`)} className="p-1 border border-[var(--border)] neo-depth-btn cursor-pointer" aria-label="Copy">
                    {copiedId === `qs-${step}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
                <CodeBlock code={code} language="bash" maxHeight="300px" />
              </div>
            </div>
          ))}
        </div>

        {/* ── Use-Case Guides ───────────────────────── */}
        <div className="space-y-4 mb-6">
          <h2 className="display-heading text-base text-[var(--foreground)] uppercase tracking-tight flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Use-Case Guides
          </h2>
          {USE_CASE_GUIDES.map((guide) => {
            const [expanded, setExpanded] = useState(false);
            return (
              <div key={guide.id} className="border-2 border-[var(--border)] bg-[var(--card-bg)]">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer text-left"
                >
                  {expanded ? <ChevronDown className="h-4 w-4 text-[var(--muted)]" /> : <ChevronRight className="h-4 w-4 text-[var(--muted)]" />}
                  <div>
                    <h3 className="display-heading text-sm text-[var(--foreground)]">{guide.title}</h3>
                    <p className="text-[10px] font-mono text-[var(--muted)]">{guide.description}</p>
                  </div>
                </button>
                {expanded && (
                  <div className="px-4 pb-4 space-y-3 border-t-2 border-[var(--border)] pt-3">
                    <ol className="list-decimal list-inside space-y-1">
                      {guide.steps.map((s, i) => (
                        <li key={i} className="text-[11px] font-mono text-[var(--muted)]">{s}</li>
                      ))}
                    </ol>
                    <div className="border-2 border-[var(--border)] bg-[var(--code-bg)] overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--card-bg)] border-b-2 border-[var(--border)]">
                        <span className="text-[10px] font-mono text-[var(--muted)] font-bold uppercase">Quick Start Code</span>
                        <button onClick={() => handleCopy(guide.code, `guide-${guide.id}`)} className="p-1 border border-[var(--border)] neo-depth-btn cursor-pointer" aria-label="Copy guide code">
                          {copiedId === `guide-${guide.id}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                      <CodeBlock code={guide.code} language="bash" maxHeight="300px" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Endpoint Modules ──────────────────────── */}
        {Object.entries(modules).map(([moduleName, moduleEndpoints]) => (
          <div key={moduleName} className="space-y-4">
            <button
              onClick={() => toggleModule(moduleName)}
              className="w-full flex items-center gap-3 p-4 border-2 border-[var(--border)] bg-[var(--card-bg)] cursor-pointer hover-glow"
              aria-expanded={!collapsedModules[moduleName]}
            >
              {collapsedModules[moduleName] ? (
                <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
              ) : (
                <ChevronDown className="h-4 w-4 text-[var(--muted)]" />
              )}
              <h2 className="display-heading text-sm text-[var(--foreground)] uppercase tracking-wider">{moduleName}</h2>
              <span className="text-[10px] font-mono text-[var(--muted)] ml-auto">{moduleEndpoints.length} endpoints</span>
            </button>

            {!collapsedModules[moduleName] && (
              <div className="space-y-4">
                {moduleEndpoints.map((endpoint) => {
                  const isActive = endpoint.id === activeEndpointId;
                  const currentTab = activeTabs[endpoint.id] || 'curl';
                  const currentSnippet = getSnippet(endpoint, currentTab);
                  let responseData: unknown = null;
                  try { responseData = JSON.parse(endpoint.response); } catch {}

                  return (
                    <section
                      key={endpoint.id}
                      id={endpoint.id}
                      onClick={() => handleSelect(endpoint.id)}
                      className={`scroll-mt-24 p-5 sm:p-6 rounded-none border-2 transition-all duration-300 cursor-pointer ${
                        isActive
                          ? 'border-[var(--foreground)] neo-depth'
                          : 'border-[var(--border)] neo-depth-zinc opacity-70 hover:opacity-100 hover-glow'
                      }`}
                      aria-label={`${endpoint.method} ${endpoint.path}`}
                    >
                      {/* Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          {methodBadge(endpoint.method)}
                          <span className="font-mono text-xs sm:text-sm font-bold text-[var(--foreground)] tracking-tight break-all">
                            {endpoint.path}
                          </span>
                          <Tooltip content="Copy endpoint URL">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopy(`${API_BASE_URL}${endpoint.path}`, `${endpoint.id}-path`); }}
                              className="p-1 border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer transition-colors"
                              aria-label="Copy endpoint path"
                            >
                              {copiedId === `${endpoint.id}-path` ? <Check className="h-3 w-3" /> : <LinkIcon className="h-3 w-3" />}
                            </button>
                          </Tooltip>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[var(--muted)] font-black uppercase tracking-widest font-mono">{endpoint.module}</span>
                          <span className="text-[9px] font-mono text-[var(--muted)] opacity-60 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" /> {ESTIMATED_TIMES[endpoint.method] || '<50ms'}
                          </span>
                        </div>
                      </div>

                      <h3 className="display-heading text-base text-[var(--foreground)] mb-1 uppercase tracking-tight">{endpoint.summary}</h3>
                      <p className="text-xs sm:text-sm text-[var(--muted)] font-bold leading-relaxed mb-5 font-mono">{endpoint.description}</p>

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                        {/* Left Column */}
                        <div className="space-y-5">
                          {/* Parameters */}
                          {endpoint.parameters && endpoint.parameters.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] flex items-center gap-2 font-mono">
                                <Info className="h-3.5 w-3.5" /> Parameters
                              </h4>
                              <div className="overflow-x-auto border-2 border-[var(--border)]">
                                <table className="w-full text-left border-collapse text-[11px]">
                                  <thead>
                                    <tr className="border-b-2 border-[var(--border)] text-[var(--muted)] font-black bg-[var(--card-bg)] font-mono uppercase tracking-wider">
                                      <th className="p-2.5">Name</th>
                                      <th className="p-2.5">Type</th>
                                      <th className="p-2.5 text-center">Req</th>
                                      <th className="p-2.5">Description</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[var(--border)] text-[var(--muted)] font-mono">
                                    {endpoint.parameters.map((param, index) => (
                                      <tr key={index} className="hover:bg-[var(--card-bg)]">
                                        <td className="p-2.5 font-semibold text-[var(--foreground)]">
                                          <Tooltip content={`Type: ${param.type}${param.required ? ' · Required' : ' · Optional'}`}>
                                            <span>{param.name}</span>
                                          </Tooltip>
                                        </td>
                                        <td className="p-2.5 text-[var(--muted)]">{param.type}</td>
                                        <td className="p-2.5 text-center">
                                          {param.required ? (
                                            <span className="text-[9px] font-black px-2 py-0.5 bg-[var(--foreground)] text-[var(--background)] border-2 border-[var(--foreground)]">Yes</span>
                                          ) : (
                                            <span className="text-[9px] text-[var(--muted)] font-bold">No</span>
                                          )}
                                        </td>
                                        <td className="p-2.5 text-[var(--muted)] leading-normal">
                                          <Tooltip content={param.description}>
                                            <span className="block truncate max-w-[200px]">{param.description}</span>
                                          </Tooltip>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Status Codes */}
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] flex items-center gap-2 font-mono">
                              <Terminal className="h-3.5 w-3.5" /> Response Status Codes
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {(STATUS_CODES[endpoint.method] || STATUS_CODES.GET).map((s) => (
                                <Tooltip key={s.code} content={`${s.code} ${s.description}`}>
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 border border-[var(--border)] text-[var(--muted)] cursor-help">
                                    <span className="text-[var(--foreground)]">{s.code}</span> {s.description}
                                  </span>
                                </Tooltip>
                              ))}
                            </div>
                          </div>

                          {/* Request Body */}
                          {endpoint.requestBody && (
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] font-mono">Request Body</h4>
                              <div className="relative border-2 border-[var(--border)] bg-[var(--code-bg)] overflow-hidden">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleCopy(endpoint.requestBody || '', `${endpoint.id}-body`); }}
                                  className="absolute right-2 top-2 p-1.5 border border-[var(--border)] neo-depth-btn bg-[var(--card-bg)] text-[var(--foreground)] font-bold cursor-pointer z-10"
                                  aria-label="Copy request body"
                                >
                                  {copiedId === `${endpoint.id}-body` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                </button>
                                <CodeBlock code={endpoint.requestBody} language="json" maxHeight="180px" />
                              </div>
                            </div>
                          )}

                          {/* Related endpoints */}
                          {(() => {
                            const related = ENDPOINTS.filter(
                              (ep) => ep.id !== endpoint.id && ep.module === endpoint.module && ep.method !== endpoint.method
                            ).slice(0, 3);
                            if (related.length === 0) return null;
                            return (
                              <div className="space-y-2">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] font-mono">Related Endpoints</h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {related.map((r) => (
                                    <button
                                      key={r.id}
                                      onClick={(e) => { e.stopPropagation(); handleSelect(r.id); }}
                                      className="text-[10px] font-mono font-bold px-2 py-0.5 border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] cursor-pointer transition-colors"
                                    >
                                      {r.method} {r.path}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                          {/* API Playground */}
                          <div onClick={(e) => e.stopPropagation()}>
                            <ApiPlayground endpoint={endpoint} />
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-5">
                          {/* Snippet */}
                          <div className="border-2 border-[var(--border)] bg-[var(--code-bg)] overflow-hidden">
                            <div className="flex items-center justify-between px-3 bg-[var(--card-bg)] border-b-2 border-[var(--border)]">
                              <div className="flex gap-1 font-mono">
                                {LANGS.map((tab, idx) => (
                                  <button
                                    key={tab}
                                    onClick={(e) => { e.stopPropagation(); setActiveTabs((prev) => ({ ...prev, [endpoint.id]: tab })); }}
                                    className={`py-2.5 px-3 text-[10px] uppercase font-black tracking-widest border-b-3 transition-all cursor-pointer ${
                                      currentTab === tab
                                        ? 'border-[var(--foreground)] text-[var(--foreground)] font-bold'
                                        : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
                                    }`}
                                    aria-label={`Show ${tab} snippet`}
                                    title={`${tab} (⌘${idx + 1})`}
                                  >
                                    {tab === 'js' ? 'Fetch' : tab === 'typescript' ? 'TS' : tab}
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCopy(currentSnippet, `${endpoint.id}-snip`); }}
                                className="p-1.5 border border-[var(--border)] neo-depth-btn bg-[var(--card-bg)] text-[var(--foreground)] font-bold cursor-pointer"
                                aria-label="Copy snippet"
                              >
                                {copiedId === `${endpoint.id}-snip` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                            <CodeBlock code={currentSnippet} language={LANG_MAP[currentTab]} maxHeight="200px" />
                          </div>

                          {/* Response JSON */}
                          <div className="border-2 border-[var(--border)] bg-[var(--code-bg)] overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2 bg-[var(--card-bg)] border-b-2 border-[var(--border)]">
                              <span className="text-[10px] uppercase font-black tracking-widest text-[var(--muted)] font-mono flex items-center gap-1.5">
                                <Terminal className="h-3.5 w-3.5" /> Response JSON
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setResponseView(responseView === 'raw' ? 'tree' : 'raw'); }}
                                  className="p-1 border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer text-[9px] font-black font-mono uppercase"
                                  aria-label={responseView === 'raw' ? 'Tree view' : 'Raw view'}
                                >
                                  {responseView === 'raw' ? <Code2 className="h-3 w-3" /> : <ListCollapse className="h-3 w-3" />}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleCopy(endpoint.response, `${endpoint.id}-resp`); }}
                                  className="p-1 border border-[var(--border)] neo-depth-btn bg-[var(--card-bg)] text-[var(--foreground)] cursor-pointer"
                                  aria-label="Copy response"
                                >
                                  {copiedId === `${endpoint.id}-resp` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                </button>
                              </div>
                            </div>
                            {responseView === 'raw' ? (
                              <CodeBlock code={endpoint.response} language="json" maxHeight="200px" />
                            ) : (
                              <div className="p-3 max-h-[200px] overflow-y-auto">
                                {responseData ? (
                                  <SchemaTree data={responseData} />
                                ) : (
                                  <span className="text-[11px] font-mono text-[var(--muted)]">Invalid JSON</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* Empty state */}
        {Object.keys(modules).length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-[var(--border)] p-8">
            <Terminal className="h-12 w-12 mb-4 text-[var(--muted)]" strokeWidth={1.5} />
            <h3 className="display-heading text-sm text-[var(--muted)] uppercase tracking-wider">No endpoints match your filters</h3>
            <button onClick={() => { setFilterMethod(null); setFilterModule(null); }} className="mt-4 text-xs font-mono font-bold neo-depth-btn px-4 py-2 border-2 border-[var(--foreground)] text-[var(--foreground)] cursor-pointer">
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Mobile hamburger */}
      <div className="lg:hidden fixed bottom-6 right-6 z-30">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-none border-3 border-[var(--foreground)] bg-[var(--card-bg)] shadow-[6px_6px_0px_0px_var(--shadow-color)] text-[var(--foreground)] cursor-pointer"
          aria-label="Open navigation menu"
        >
          <ListCollapse className="h-5 w-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-[var(--background)]/80 backdrop-blur-sm z-30"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 right-0 w-full max-w-xs bg-[var(--card-bg)] border-l-3 border-[var(--foreground)] p-6 z-40 overflow-y-auto scrollbar-thin flex flex-col gap-6"
            >
              <div className="flex items-center justify-between border-b-2 border-[var(--border)] pb-3">
                <span className="text-sm font-black text-[var(--foreground)] uppercase tracking-wider font-mono">Navigate Docs</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 border-2 border-[var(--border)] neo-depth-btn text-xs font-bold font-mono text-[var(--muted)] hover:text-[var(--foreground)] uppercase cursor-pointer">
                  Close
                </button>
              </div>

              <Sidebar
                endpoints={ENDPOINTS}
                activeId={activeEndpointId}
                onSelect={(id) => { handleSelect(id); setMobileMenuOpen(false); }}
              />

              <div className="mt-auto pt-8 border-t border-[var(--border)]">
                <div className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground)] flex flex-col gap-2">
                  <span className="opacity-60">CREATED &amp; BUILT BY</span>
                  <a href="https://www.linkedin.com/in/gaurav-kaloliya-b44569417" target="_blank" rel="noopener noreferrer" className="font-bold border-b-2 border-[var(--foreground)] pb-px inline-block hover:opacity-80 transition-opacity">
                    GAURAV KALOLIYA
                  </a>
                  <div className="flex items-center gap-3 text-[9px] tracking-[0.15em] pt-1">
                    <a href="https://github.com/GauravKaloliya/gnovium" target="_blank" rel="noopener noreferrer" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1">
                      GITHUB <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                    <span className="opacity-30">•</span>
                    <a href="https://www.linkedin.com/in/gaurav-kaloliya-b44569417" target="_blank" rel="noopener noreferrer" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1">
                      LINKEDIN <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DocsPage() {
  return (
    <ErrorBoundary>
      <PageWrapper>
        <Suspense fallback={
          <div className="space-y-4">
            <div className="h-12 shimmer" />
            <div className="h-8 shimmer w-1/2" />
            <div className="h-64 shimmer" />
            <div className="h-48 shimmer" />
            <div className="h-48 shimmer" />
          </div>
        }>
          <DocsContent />
          <Footer />
        </Suspense>
      </PageWrapper>
    </ErrorBoundary>
  );
}
