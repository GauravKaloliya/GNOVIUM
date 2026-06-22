'use client';

import { Home } from 'lucide-react';
import Link from 'next/link';

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  segments: BreadcrumbSegment[];
}

export default function Breadcrumbs({ segments }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--muted)] mb-4 overflow-x-auto scrollbar-none">
      <Link href="/" className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors shrink-0">
        <Home className="h-3 w-3" />
        <span>Home</span>
      </Link>
      {segments.length > 0 && (
        <span className="text-[var(--muted)] shrink-0 font-mono">›</span>
      )}
      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-1.5 shrink-0">
          {seg.href ? (
            <Link href={seg.href} className="hover:text-[var(--foreground)] transition-colors">
              {seg.label}
            </Link>
          ) : (
            <span className="text-[var(--foreground)]">{seg.label}</span>
          )}
          {i < segments.length - 1 && (
            <span className="text-[var(--muted)] font-mono">›</span>
          )}
        </span>
      ))}
    </nav>
  );
}
