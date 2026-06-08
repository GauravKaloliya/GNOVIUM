'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Copy, Check, Info, ListCollapse } from 'lucide-react';
import PageWrapper from '@/components/PageWrapper';
import Sidebar from '@/components/Sidebar';
import { ENDPOINTS, Endpoint } from '@/data/endpoints';

const API_BASE_URL = 'https://www.gnovium.com';

function DocsContent() {
  const searchParams = useSearchParams();
  const [activeEndpointId, setActiveEndpointId] = useState(ENDPOINTS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTabs, setActiveTabs] = useState<Record<string, 'curl' | 'js' | 'python'>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Set active endpoint if deep linked
  useEffect(() => {
    const endpointId = searchParams.get('endpoint');
    if (endpointId) {
      const ep = ENDPOINTS.find((e) => e.id === endpointId);
      if (ep) {
        setActiveEndpointId(endpointId);
        const element = document.getElementById(endpointId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  }, [searchParams]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSnippet = (endpoint: Endpoint, lang: 'curl' | 'js' | 'python') => {
    const url = `${API_BASE_URL}${endpoint.path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(endpoint.id.startsWith('auth') ? {} : { Authorization: 'Bearer $ACCESS_TOKEN' }),
    };

    if (lang === 'curl') {
      const headerStr = Object.entries(headers)
        .map(([k, v]) => `-H "${k}: ${v}"`)
        .join(' \\\n  ');
      
      const bodyStr = endpoint.requestBody
        ? ` \\\n  -d '${endpoint.requestBody.replace(/\n\s*/g, '')}'`
        : '';

      return `curl -X ${endpoint.method} ${url} \\\n  ${headerStr}${bodyStr}`;
    }

    if (lang === 'js') {
      const fetchOptions = {
        method: endpoint.method,
        headers,
        ...(endpoint.requestBody ? { body: JSON.parse(endpoint.requestBody) } : {}),
      };
      return `fetch("${url}", ${JSON.stringify(fetchOptions, null, 2)});`;
    }

    if (lang === 'python') {
      const reqHeaders = JSON.stringify(headers, null, 4);
      const reqData = endpoint.requestBody ? `, json=${endpoint.requestBody}` : '';
      return `import requests\n\nresponse = requests.${endpoint.method.toLowerCase()}(\n    "${url}",\n    headers=${reqHeaders}${reqData}\n)\nprint(response.json())`;
    }

    return '';
  };

  const methodColors = {
    GET: 'text-zinc-100 bg-white/5 border-2 border-white/20',
    POST: 'text-zinc-100 bg-white/5 border-2 border-white/20',
    PATCH: 'text-zinc-100 bg-white/5 border-2 border-white/20',
    DELETE: 'text-rose-400 bg-rose-500/10 border-2 border-rose-500/30',
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 relative items-start">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 shrink-0 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 scrollbar-thin">
        <Sidebar
          endpoints={ENDPOINTS}
          activeId={activeEndpointId}
          onSelect={(id) => {
            setActiveEndpointId(id);
            const el = document.getElementById(id);
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />
      </div>

      {/* Main Reference Sheet */}
      <div className="flex-1 w-full space-y-12">
        {/* Isometric 3D Geometric Visual Identity Hero Header */}
        <div className="p-6 sm:p-8 rounded-none border-[3px] border-white bg-zinc-950 neo-depth flex flex-col md:flex-row items-center justify-between gap-8 mb-12 overflow-hidden">
          <div className="space-y-4 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-none border-2 border-white bg-white/10 text-[10px] font-black tracking-widest uppercase text-white font-mono shadow-[2px_2px_0px_0px_#ffffff]">
              GNOVIUM SCHEMA CORE
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase font-mono">
              API Reference
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-mono font-bold">
              A minimalist, high-fidelity isometric projection of the Gnovium Knowledge OS endpoint schema. Built with sharp parallel extrusions, flat shading, and zero-dependency offline schemas.
            </p>
            <div className="flex flex-wrap gap-3 pt-2 font-mono text-[11px] font-bold">
              <span className="px-2.5 py-1 border-2 border-zinc-700 text-zinc-300 bg-zinc-900 shadow-[2px_2px_0px_0px_#3f3f46]">HOST: www.gnovium.com</span>
              <span className="px-2.5 py-1 border-2 border-zinc-700 text-zinc-300 bg-zinc-900 shadow-[2px_2px_0px_0px_#3f3f46]">VERSION: v1.0.0</span>
              <span className="px-2.5 py-1 border-2 border-zinc-700 text-zinc-300 bg-zinc-900 shadow-[2px_2px_0px_0px_#3f3f46]">DB: OFFLINE SCHEMA</span>
            </div>
          </div>

          <div className="iso-perspective hidden sm:flex items-center justify-center p-4 mr-6">
            <div className="iso-assembly">
              {/* Layer 3 - Top (API Docs) */}
              <div className="iso-layer-3 iso-block transition-transform duration-500">
                <div className="iso-face-top">
                  <span className="text-[9px] font-bold text-zinc-500 font-mono mb-1">LAYER 03</span>
                  <span className="text-[10px] font-black tracking-wider uppercase">API DOCUMENTATION</span>
                  <div className="mt-2 h-1.5 w-10 bg-white" />
                </div>
                <div className="iso-face-left" />
                <div className="iso-face-right" />
              </div>

              {/* Layer 2 - Middle (API Router) */}
              <div className="iso-layer-2 iso-block transition-transform duration-500">
                <div className="iso-face-top bg-zinc-900 border-zinc-400">
                  <span className="text-[9px] font-bold text-zinc-500 font-mono mb-1">LAYER 02</span>
                  <span className="text-[10px] font-black tracking-wider uppercase text-zinc-300">ROUTING GATEWAY</span>
                  <div className="mt-2 h-1.5 w-10 bg-zinc-400" />
                </div>
                <div className="iso-face-left border-zinc-400" />
                <div className="iso-face-right border-zinc-400" />
              </div>

              {/* Layer 1 - Bottom (Core Logic) */}
              <div className="iso-layer-1 iso-block transition-transform duration-500">
                <div className="iso-face-top bg-zinc-950 border-zinc-600">
                  <span className="text-[9px] font-bold text-zinc-600 font-mono mb-1">LAYER 01</span>
                  <span className="text-[10px] font-black tracking-wider uppercase text-zinc-500">CORE SERVICES</span>
                  <div className="mt-2 h-1.5 w-10 bg-zinc-700" />
                </div>
                <div className="iso-face-left border-zinc-600" />
                <div className="iso-face-right border-zinc-600" />
              </div>
            </div>
          </div>
        </div>

        {/* ── MVP Quickstart Guide ───────────────────────────────── */}
        <div id="quickstart-guide" className="p-6 sm:p-8 rounded-none border-[3px] border-white bg-zinc-950 neo-depth mb-12 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-none border-2 border-white bg-white/10 text-[10px] font-black tracking-widest uppercase text-white font-mono shadow-[2px_2px_0px_0px_#ffffff] mb-4">
              QUICKSTART · MVP FLOWS
            </div>
            <h2 className="text-2xl font-black text-white uppercase font-mono tracking-tight mb-2">Core Developer Flows</h2>
            <p className="text-xs text-zinc-400 font-mono leading-relaxed">
              Step-by-step flows to go from zero to a fully functioning Knowledge OS workspace. Follow these in order for the fastest path to a working MVP.
            </p>
          </div>

          {/* Database Modes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-zinc-700 bg-zinc-900/60 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono mb-2">🖥 LOCAL MODE (SQLite)</div>
              <p className="text-xs text-zinc-300 font-mono leading-relaxed">Run locally without any cloud infrastructure. Set <code className="bg-zinc-800 px-1 text-white">DATABASE_URL=sqlite:///local.db</code> (or omit it entirely). Perfect for offline development and single-user workspaces.</p>
            </div>
            <div className="border-2 border-zinc-700 bg-zinc-900/60 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono mb-2">☁️ CLOUD MODE (PostgreSQL)</div>
              <p className="text-xs text-zinc-300 font-mono leading-relaxed">Set <code className="bg-zinc-800 px-1 text-white">DATABASE_URL=postgresql://...</code> for multi-user collaboration, cloud backups, vector search (pgvector), and full-text search (TSVECTOR).</p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            {[
              {
                step: '01',
                title: 'Register & Authenticate',
                endpoints: 'POST /api/v1/auth/register → POST /api/v1/auth/login',
                description: 'Create an account then log in. Save the access_token and refresh_token from the login response.',
                code: `curl -X POST https://api.gnovium.com/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@gnovium.dev","password":"change-me-123"}'`,
              },
              {
                step: '02',
                title: 'Create a Workspace',
                endpoints: 'POST /api/v1/workspaces/',
                description: 'Every entity, block, and graph lives inside a workspace. Create one and save its workspace_id.',
                code: `curl -X POST https://api.gnovium.com/api/v1/workspaces/ \\
  -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Knowledge OS","description":"My local knowledge graph"}'`,
              },
              {
                step: '03',
                title: 'Create Entity + Blocks',
                endpoints: 'POST /api/v1/entities/ → POST /api/v1/blocks/',
                description: 'Create a page entity, then append content blocks (paragraphs, headings, callouts). Blocks use fractional positioning so you can reorder without re-indexing.',
                code: `# Create entity
curl -X POST https://api.gnovium.com/api/v1/entities/ \\
  -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -d '{"workspace_id":"<WS_ID>","title":"Research Notes","entity_type_id":"<TYPE_ID>"}'

# Add a paragraph block
curl -X POST https://api.gnovium.com/api/v1/blocks/ \\
  -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -d '{"entity_id":"<ENTITY_ID>","block_type":"paragraph","content":{"text":"Hello world"}}'`,
              },
              {
                step: '04',
                title: 'Add Relations (Build the Graph)',
                endpoints: 'POST /api/v1/relations/',
                description: 'Connect entities with typed edges. Relation types are free-form strings (e.g. "references", "depends_on", "contradicts"). This builds your knowledge graph.',
                code: `curl -X POST https://api.gnovium.com/api/v1/relations/ \\
  -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -d '{
    "workspace_id":"<WS_ID>",
    "source_entity_id":"<ENTITY_A>",
    "target_entity_id":"<ENTITY_B>",
    "relation_type":"references"
  }'`,
              },
              {
                step: '05',
                title: 'Query the Knowledge Graph',
                endpoints: 'POST /api/v1/graph/query · /graph/traverse · /graph/paths',
                description: 'Explore the graph: filter nodes/edges by type, traverse outward from any node up to depth 5, or find the shortest connection path between two nodes.',
                code: `# Traverse from a node (depth 2)
curl -X POST https://api.gnovium.com/api/v1/graph/traverse \\
  -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -d '{"workspace_id":"<WS_ID>","center_node":"<ENTITY_ID>","depth":2}'

# Find shortest path
curl -X POST https://api.gnovium.com/api/v1/graph/paths \\
  -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -d '{"workspace_id":"<WS_ID>","source_entity_id":"<A>","target_entity_id":"<B>"}'`,
              },
              {
                step: '06',
                title: 'Ask AI About Your Workspace',
                endpoints: 'POST /api/v1/ai/query',
                description: 'Submit a natural language question. The API retrieves relevant workspace context via semantic search and passes it to the configured LLM (Ollama or cloud provider).',
                code: `curl -X POST https://api.gnovium.com/api/v1/ai/query \\
  -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -d '{"workspace_id":"<WS_ID>","question":"Summarize authentication mechanisms","limit":5}'`,
              },
            ].map(({ step, title, endpoints, description, code }) => (
              <div key={step} className="border-l-[3px] border-white pl-6 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black px-2 py-0.5 bg-white text-zinc-950 font-mono tracking-widest">{step}</span>
                  <h3 className="text-sm font-black text-white uppercase font-mono tracking-tight">{title}</h3>
                </div>
                <div className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase">{endpoints}</div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">{description}</p>
                <pre className="bg-zinc-900 border border-white/10 p-3 text-[11px] font-mono text-zinc-300 overflow-x-auto rounded-none leading-relaxed">{code}</pre>
              </div>
            ))}
          </div>
        </div>

        {ENDPOINTS.map((endpoint) => {
          const isActive = endpoint.id === activeEndpointId;
          const currentTab = activeTabs[endpoint.id] || 'curl';
          const currentSnippet = getSnippet(endpoint, currentTab);

          return (
            <section
              key={endpoint.id}
              id={endpoint.id}
              onClick={() => setActiveEndpointId(endpoint.id)}
              className={`scroll-mt-24 p-6 sm:p-8 rounded-none border transition-all duration-500 cursor-pointer ${
                isActive
                  ? 'bg-zinc-950 border-white neo-depth'
                  : 'bg-zinc-900/10 border-white/5 neo-depth-zinc opacity-60 hover:opacity-100'
              }`}
            >
              {/* Header Method Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-none border-2 ${methodColors[endpoint.method]}`}>
                    {endpoint.method}
                  </span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-slate-200 tracking-tight break-all">
                    {endpoint.path}
                  </span>
                </div>
                <span className="text-xs text-zinc-500 font-black uppercase tracking-widest font-mono">{endpoint.module}</span>
              </div>

              {/* Title & Description */}
              <h2 className="text-xl font-black text-white mb-2 uppercase font-mono tracking-tight">{endpoint.summary}</h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-bold leading-relaxed mb-6 font-mono">{endpoint.description}</p>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                {/* Parameters Details */}
                <div className="space-y-6">
                  {/* Query Params Table */}
                  {endpoint.parameters && endpoint.parameters.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 font-mono">
                        <Info className="h-4 w-4 text-zinc-400 stroke-[2.5]" /> Parameters
                      </h3>
                      <div className="overflow-x-auto rounded-none border-2 border-white/10 bg-slate-950/40">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b-2 border-white/10 text-zinc-400 font-black bg-slate-950 font-mono uppercase tracking-wider">
                              <th className="p-3">Name</th>
                              <th className="p-3">Type</th>
                              <th className="p-3 text-center">Required</th>
                              <th className="p-3">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y-2 divide-white/5 text-slate-300 font-mono">
                            {endpoint.parameters.map((param, index) => (
                              <tr key={index} className="hover:bg-white/5">
                                <td className="p-3 font-semibold text-white">{param.name}</td>
                                <td className="p-3 text-zinc-400">{param.type}</td>
                                <td className="p-3 text-center">
                                  {param.required ? (
                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-none bg-white text-zinc-950 border-2 border-white shadow-[1px_1px_0px_0px_#ffffff]">Yes</span>
                                  ) : (
                                    <span className="text-[9px] text-zinc-600 font-bold">No</span>
                                  )}
                                </td>
                                <td className="p-3 text-zinc-400 leading-normal">{param.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Request JSON payload */}
                  {endpoint.requestBody && (
                    <div className="space-y-3">
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-500 font-mono">Request Body</span>
                      <div className="relative rounded-none border-2 border-white/10 bg-zinc-950 p-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(endpoint.requestBody || '', `${endpoint.id}-body`);
                          }}
                          className="absolute right-3 top-3 p-2 rounded-none bg-zinc-900 text-white font-bold transition-all border-2 border-white/20 neo-depth-btn hover:bg-zinc-800"
                        >
                          {copiedId === `${endpoint.id}-body` ? <Check className="h-3.5 w-3.5 text-white" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        <pre className="font-mono text-xs text-slate-300 overflow-x-auto max-h-[220px]">
                          <code>{endpoint.requestBody}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tabbed Code Snippet */}
                <div className="space-y-6">
                  <div className="rounded-none border-2 border-white/10 bg-zinc-950 overflow-hidden">
                    <div className="flex items-center justify-between px-3 bg-zinc-900 border-b-2 border-white/10">
                      <div className="flex gap-2 font-mono">
                        {(['curl', 'js', 'python'] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTabs((prev) => ({ ...prev, [endpoint.id]: tab }));
                            }}
                            className={`py-3.5 px-4 text-[10px] uppercase font-black tracking-widest border-b-3 transition-all ${
                              currentTab === tab
                                ? 'border-white text-white font-bold'
                                : 'border-transparent text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            {tab === 'js' ? 'Fetch' : tab}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(currentSnippet, `${endpoint.id}-snip`);
                        }}
                        className="p-2 rounded-none bg-zinc-900 border-2 border-white/20 neo-depth-btn text-white font-bold transition-all hover:bg-zinc-800"
                      >
                        {copiedId === `${endpoint.id}-snip` ? <Check className="h-3.5 w-3.5 text-white" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <pre className="p-4 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-[220px] leading-relaxed">
                      <code>{currentSnippet}</code>
                    </pre>
                  </div>

                  {/* Sample JSON Response */}
                  <div className="rounded-none border-2 border-white/10 bg-zinc-950 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b-2 border-white/10 text-[10px] uppercase font-black tracking-widest text-zinc-500 font-mono">
                      <span className="flex items-center gap-1.5 text-zinc-400">
                        <Terminal className="h-4 w-4 stroke-[2.5]" /> Response JSON
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(endpoint.response, `${endpoint.id}-resp`);
                        }}
                        className="p-2 rounded-none bg-zinc-900 border-2 border-white/20 neo-depth-btn text-white font-bold transition-all hover:bg-zinc-800"
                      >
                        {copiedId === `${endpoint.id}-resp` ? <Check className="h-3.5 w-3.5 text-white" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <pre className="p-4 font-mono text-[11px] text-zinc-200 overflow-x-auto max-h-[220px] leading-relaxed">
                      <code>{endpoint.response}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Floating Hamburger drawer button on mobile */}
      <div className="lg:hidden fixed bottom-6 right-6 z-30">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-none border-3 border-white bg-zinc-900 shadow-[6px_6px_0px_0px_#27272a] text-white cursor-pointer"
        >
          <ListCollapse className="h-5 w-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Sliding Mobile drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 right-0 w-80 max-w-xs bg-zinc-950 border-l-3 border-white p-6 z-40 overflow-y-auto scrollbar-thin flex flex-col gap-6"
            >
              <div className="flex items-center justify-between border-b-2 border-white/10 pb-3">
                <span className="text-sm font-black text-white uppercase tracking-wider font-mono">Navigate Docs</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-none border-2 border-white/20 neo-depth-btn text-xs font-bold font-mono text-zinc-400 hover:text-white uppercase cursor-pointer"
                >
                  Close
                </button>
              </div>

              <Sidebar
                endpoints={ENDPOINTS}
                activeId={activeEndpointId}
                onSelect={(id) => {
                  setActiveEndpointId(id);
                  setMobileMenuOpen(false);
                  const el = document.getElementById(id);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DocsPage() {
  return (
    <PageWrapper>
      <Suspense fallback={
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-none h-8 w-8 border-t-3 border-white" />
        </div>
      }>
        <DocsContent />
      </Suspense>
    </PageWrapper>
  );
}
