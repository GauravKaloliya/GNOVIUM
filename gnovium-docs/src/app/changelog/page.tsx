'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, GitBranch, AlertTriangle, ArrowUp, ArrowDown, Shield, Tag, ChevronDown, ChevronRight, ExternalLink, Download } from 'lucide-react';
import PageWrapper from '@/components/PageWrapper';
import Footer from '@/components/Footer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { CHANGELOG, VERSIONING_POLICY, DEPRECATION_TIMELINE } from '@/data';

const VERSION_TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  major: { bg: 'bg-[var(--foreground)]', text: 'text-[var(--background)]', label: 'MAJOR' },
  minor: { bg: 'bg-sky-500/20', text: 'text-sky-400', label: 'MINOR' },
  patch: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'PATCH' },
  deprecation: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'DEPRECATION' },
  beta: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'BETA' },
};

const CHANGE_TYPE_STYLES: Record<string, string> = {
  added: 'text-emerald-400',
  changed: 'text-sky-400',
  deprecated: 'text-amber-400',
  removed: 'text-rose-400',
  fixed: 'text-purple-400',
  security: 'text-red-400',
};

export default function ChangelogPage() {
  const [expandedVersion, setExpandedVersion] = useState<string>(CHANGELOG[0].version);

  const toggleVersion = (version: string) => {
    setExpandedVersion(expandedVersion === version ? '' : version);
  };

  return (
    <ErrorBoundary>
      <PageWrapper>
        <div className="space-y-8">
          {/* Header */}
          <div className="p-6 sm:p-8 rounded-none border-[3px] border-[var(--foreground)] neo-depth flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-none border-2 border-[var(--foreground)] bg-[var(--card-bg)] text-[10px] font-black tracking-widest uppercase font-mono neo-depth-btn">
                <GitBranch className="h-3.5 w-3.5" /> CHANGELOG
              </div>
              <h1 className="display-heading text-2xl sm:text-3xl tracking-tight text-[var(--foreground)] uppercase">
                Release History & Versioning
              </h1>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed font-mono font-bold max-w-2xl">
                Track every change, feature, deprecation, and breaking update across Gnovium API versions.
                We follow semantic versioning and provide a minimum 6-month deprecation window for breaking changes.
              </p>
              <div className="flex flex-wrap gap-3 pt-2 font-mono text-[10px] font-bold">
                <span className="px-2.5 py-1 border-2 border-[var(--border)] text-[var(--muted)] bg-[var(--card-bg)]">
                  Current: {VERSIONING_POLICY.current}
                </span>
                <span className="px-2.5 py-1 border-2 border-[var(--border)] text-[var(--muted)] bg-[var(--card-bg)]">
                  Next: {VERSIONING_POLICY.next}
                </span>
                <span className="px-2.5 py-1 border-2 border-[var(--border)] text-[var(--muted)] bg-[var(--card-bg)]">
                  Supported: {VERSIONING_POLICY.supportedVersions.join(', ')}
                </span>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <a
                href="/openapi.json"
                download
                className="text-[10px] font-black font-mono uppercase tracking-wider px-4 py-2 border-2 border-[var(--border)] neo-depth-btn text-[var(--foreground)] hover:bg-[var(--code-bg)] transition-all flex items-center gap-1.5"
              >
                <Download className="h-3 w-3" /> OpenAPI JSON
              </a>
              <a
                href="/openapi.yaml"
                download
                className="text-[10px] font-black font-mono uppercase tracking-wider px-4 py-2 border-2 border-[var(--border)] neo-depth-btn text-[var(--foreground)] hover:bg-[var(--code-bg)] transition-all flex items-center gap-1.5"
              >
                <Download className="h-3 w-3" /> OpenAPI YAML
              </a>
            </div>
          </div>

          {/* Versioning Policy */}
          <div className="border-2 border-[var(--border)] bg-[var(--card-bg)] p-6">
            <h2 className="display-heading text-base text-[var(--foreground)] uppercase tracking-tight mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4" /> Versioning Policy
            </h2>
            <div className="prose prose-sm max-w-none">
              {VERSIONING_POLICY.policy.split('\n').map((line, i) => {
                if (line.startsWith('## ')) {
                  return <h3 key={i} className="text-sm font-black font-mono text-[var(--foreground)] uppercase tracking-wider mt-4 mb-2">{line.replace('## ', '')}</h3>;
                }
                if (line.startsWith('- **')) {
                  const match = line.match(/- \*\*(.+?)\*\*(.+)/);
                  if (match) {
                    return (
                      <div key={i} className="flex items-start gap-2 text-[11px] font-mono text-[var(--muted)] mb-2">
                        <span className="text-[var(--foreground)] font-bold shrink-0 mt-0.5">{match[1]}</span>
                        <span>{match[2]}</span>
                      </div>
                    );
                  }
                }
                if (line.startsWith('|')) {
                  return null;
                }
                if (line.trim()) {
                  return <p key={i} className="text-[11px] font-mono text-[var(--muted)] leading-relaxed mb-2">{line}</p>;
                }
                return null;
              })}

              {/* Version Table */}
              <div className="overflow-x-auto border-2 border-[var(--border)] mt-4">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b-2 border-[var(--border)] text-[var(--muted)] font-black bg-[var(--code-bg)] font-mono uppercase tracking-wider">
                      <th className="p-3">Version</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Release</th>
                      <th className="p-3">End of Life</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] text-[var(--muted)] font-mono">
                    {[
                      { version: 'v1', status: 'Current', release: 'Jun 2026', eol: 'Dec 2027', current: true },
                      { version: 'v2', status: 'Beta', release: 'Q4 2026', eol: 'Jun 2029', current: false },
                      { version: 'v3', status: 'Planned', release: 'Q2 2027', eol: 'TBD', current: false },
                    ].map((row) => (
                      <tr key={row.version} className="hover:bg-[var(--card-bg)]">
                        <td className="p-3 font-bold text-[var(--foreground)]">{row.version}</td>
                        <td className="p-3">
                          {row.current ? (
                            <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">{row.status}</span>
                          ) : (
                            <span className="text-[10px] font-mono text-[var(--muted)]">{row.status}</span>
                          )}
                        </td>
                        <td className="p-3">{row.release}</td>
                        <td className="p-3">{row.eol}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Deprecation Timeline */}
          <div className="border-2 border-[var(--border)] bg-[var(--card-bg)] p-6">
            <h2 className="display-heading text-base text-[var(--foreground)] uppercase tracking-tight mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Deprecation Timeline
            </h2>
            <div className="overflow-x-auto border-2 border-[var(--border)]">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b-2 border-[var(--border)] text-[var(--muted)] font-black bg-[var(--code-bg)] font-mono uppercase tracking-wider">
                    <th className="p-3">Feature</th>
                    <th className="p-3">Deprecated In</th>
                    <th className="p-3">Removal In</th>
                    <th className="p-3">Migration Path</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[var(--muted)] font-mono">
                  {DEPRECATION_TIMELINE.map((item, i) => (
                    <tr key={i} className="hover:bg-[var(--card-bg)]">
                      <td className="p-3 font-semibold text-[var(--foreground)]">{item.feature}</td>
                      <td className="p-3">
                        <span className="text-[10px] font-black px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">{item.deprecatedIn}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] font-black px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono">{item.removalIn}</span>
                      </td>
                      <td className="p-3 text-[var(--muted)]">{item.migration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Version Entries */}
          <div className="space-y-6">
            <h2 className="display-heading text-base text-[var(--foreground)] uppercase tracking-tight flex items-center gap-2">
              <Clock className="h-4 w-4" /> Release History
            </h2>

            {CHANGELOG.map((entry) => {
              const isExpanded = expandedVersion === entry.version;
              const style = VERSION_TYPE_STYLES[entry.type] || VERSION_TYPE_STYLES.patch;

              return (
                <div key={entry.version} className="border-2 border-[var(--border)] bg-[var(--card-bg)]">
                  <button
                    onClick={() => toggleVersion(entry.version)}
                    className="w-full flex items-center gap-4 px-5 py-4 cursor-pointer text-left"
                  >
                    <div className={`w-12 h-12 border-2 border-[var(--border)] flex items-center justify-center shrink-0 ${style.bg}`}>
                      <Tag className={`h-5 w-5 ${style.text}`} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className={`text-[10px] font-black px-2 py-0.5 border font-mono ${style.bg} ${style.text} border-[var(--border)]`}>
                          {style.label}
                        </span>
                        <span className="text-base font-black font-mono text-[var(--foreground)]">{entry.version}</span>
                        <span className="text-[10px] font-mono text-[var(--muted)]">{entry.date}</span>
                        {entry.breaking && (
                          <span className="text-[10px] font-black px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono flex items-center gap-1">
                            <AlertTriangle className="h-2.5 w-2.5" /> BREAKING
                          </span>
                        )}
                      </div>
                      <h3 className="display-heading text-sm text-[var(--foreground)] mt-1">{entry.title}</h3>
                      <p className="text-[11px] font-mono text-[var(--muted)] mt-0.5">{entry.description}</p>
                    </div>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-[var(--muted)] shrink-0" /> : <ChevronRight className="h-4 w-4 text-[var(--muted)] shrink-0" />}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t-2 border-[var(--border)] overflow-hidden"
                      >
                        <div className="p-5 space-y-1.5">
                          {entry.changes.map((change, i) => (
                            <div key={i} className="flex items-start gap-3 py-1.5">
                              <span className={`text-[10px] font-black uppercase tracking-widest font-mono w-20 shrink-0 pt-0.5 ${CHANGE_TYPE_STYLES[change.type] || 'text-[var(--muted)]'}`}>
                                {change.type}
                              </span>
                              <p className="text-[11px] font-mono text-[var(--muted)] leading-relaxed">{change.description}</p>
                              {change.module && (
                                <span className="text-[9px] font-mono text-[var(--muted)] px-1.5 py-0.5 border border-[var(--border)] shrink-0 ml-auto">{change.module}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
        <Footer />
      </PageWrapper>
    </ErrorBoundary>
  );
}
