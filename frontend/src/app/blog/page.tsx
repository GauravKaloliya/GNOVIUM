'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import ParticleGraph from '../components/ParticleGraph';
import Navbar from '../components/Navbar';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 100, damping: 15 },
  },
};

export default function BlogPage() {
  const posts = [
    {
      title: 'Building Sovereign Knowledge Graphs: Why Local Data Rules',
      date: 'June 20, 2026',
      readTime: '5 min read',
      excerpt: 'Discover why local knowledge representation is the future of enterprise intelligence, bypassing centralized data silos.',
      category: 'Architecture',
      link: '#',
    },
    {
      title: 'Optimizing Hybrid Semantic Search on SQLite',
      date: 'May 14, 2026',
      readTime: '8 min read',
      excerpt: 'How we squeezed sub-millisecond retrieval speeds from embedded SQL databases using hybrid BM25 and vector indexing.',
      category: 'Database',
      link: '#',
    },
    {
      title: 'Securing LLM Operations: Access Policies and Governance',
      date: 'April 02, 2026',
      readTime: '6 min read',
      excerpt: 'A deep dive into setting up role-based query policies to secure enterprise metadata when piping local datasets into Ollama.',
      category: 'Security',
      link: '#',
    },
  ];

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--foreground)] selection:text-[var(--background)] py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <Navbar />
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <ParticleGraph />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="font-mono text-xs font-black uppercase tracking-widest px-3 py-1 bg-[var(--foreground)] text-[var(--background)] border-2 border-[var(--foreground)] mb-4 inline-block">
            LATEST INSIGHTS
          </span>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight font-mono mb-4">
            THE GNOVIUM CHRONICLES
          </h1>
          <p className="max-w-2xl text-[var(--muted)] font-mono text-sm leading-relaxed">
            Tech deep-dives, developer guides, and core updates directly from the engineering team.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full"
        >
          {posts.map((post) => (
            <motion.div
              key={post.title}
              variants={itemVariants}
              className="relative flex flex-col justify-between p-8 border-4 border-[var(--foreground)] bg-[var(--card-bg)] shadow-[6px_6px_0px_0px_var(--shadow-color)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_var(--shadow-color)]"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 border-2 border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]">
                    {post.category}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--muted)] font-bold">{post.readTime}</span>
                </div>
                <h3 className="font-mono text-base font-black uppercase tracking-tight mb-3 leading-snug">
                  {post.title}
                </h3>
                <p className="text-xs text-[var(--muted)] font-mono leading-relaxed mb-6">
                  {post.excerpt}
                </p>
              </div>

              <div>
                <div className="w-full h-[2px] bg-[var(--foreground)] opacity-20 mb-4" />
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-[var(--muted)] font-bold">{post.date}</span>
                  <Link
                    href={post.link}
                    className="font-mono text-[11px] font-black uppercase tracking-wider text-[var(--foreground)] hover:underline flex items-center gap-1"
                  >
                    Read Article →
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
