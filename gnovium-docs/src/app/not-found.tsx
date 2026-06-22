'use client';

import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="border-[3px] border-[var(--foreground)] p-8 neo-depth mb-8 max-w-md">
        <FileQuestion className="h-16 w-16 mx-auto mb-4 text-[var(--foreground)]" strokeWidth={1.5} />
        <div className="text-5xl font-black font-mono mb-2 text-[var(--foreground)]">404</div>
        <h1 className="text-lg font-black font-mono uppercase tracking-wider mb-2 text-[var(--foreground)]">
          Page Not Found
        </h1>
        <p className="text-sm font-mono text-[var(--muted)] mb-6">
          This page doesn&apos;t exist. The API documentation is all on one page — start from the home page.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 border-2 border-[var(--foreground)] neo-depth-btn text-[var(--foreground)] font-black font-mono text-xs uppercase tracking-widest"
        >
          Go to Docs
        </Link>
      </div>
    </div>
  );
}
