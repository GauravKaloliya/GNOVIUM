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

export default function PricingPage() {
  const tiers = [
    {
      name: 'Free Starter',
      price: '$0',
      period: 'forever',
      description: 'Ideal for getting started with local knowledge bases.',
      features: [
        '1 Local Knowledge Base',
        'Basic Semantic Search',
        'SQLite Local Database',
        'Standard Rate Limits (100 req/min)',
        'Community Support',
      ],
      buttonText: 'Get Started',
      href: '/signup',
      popular: false,
    },
    {
      name: 'Professional',
      price: '$29',
      period: 'per month',
      description: 'Perfect for power users and small engineering teams.',
      features: [
        'Unlimited Knowledge Bases',
        'Advanced Hybrid Vector Search',
        'Neon PostgreSQL & Upstash Redis Cache',
        'Higher Rate Limits (500 req/min)',
        'Priority S3 Upload Support',
        'Email & Discord Support',
      ],
      buttonText: 'Upgrade to Pro',
      href: '/signup',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contract',
      description: 'Custom setups for high throughput and dedicated LLMs.',
      features: [
        'Self-hosted / Cloud Deployments',
        'Dedicated Ollama/LLM Instances',
        'Custom Governance & Access Policies',
        'Zero Rate Limits (Configurable)',
        '99.9% Dedicated SLA Support',
        'Dedicated Solutions Architect',
      ],
      buttonText: 'Contact Sales',
      href: 'mailto:sales@gnovium.com',
      popular: false,
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
            PLANS & PRICING
          </span>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight font-mono mb-4">
            CHOOSE YOUR POWER
          </h1>
          <p className="max-w-2xl text-[var(--muted)] font-mono text-sm leading-relaxed">
            Scalable, zero-nonsense pricing for sovereign knowledge graphs. Pick a plan that fits your scale.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full"
        >
          {tiers.map((tier) => (
            <motion.div
              key={tier.name}
              variants={itemVariants}
              className={`relative flex flex-col justify-between p-8 border-4 border-[var(--foreground)] bg-[var(--card-bg)] shadow-[6px_6px_0px_0px_var(--shadow-color)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] ${
                tier.popular ? 'md:-translate-y-4 shadow-[8px_8px_0px_0px_var(--shadow-color)]' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider bg-[var(--foreground)] text-[var(--background)] border-2 border-[var(--foreground)] shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                  MOST POPULAR
                </div>
              )}

              <div>
                <h3 className="font-mono text-xl font-black uppercase mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-1 my-4 font-mono">
                  <span className="text-4xl font-black tracking-tight">{tier.price}</span>
                  <span className="text-xs text-[var(--muted)] font-bold">/ {tier.period}</span>
                </div>
                <p className="text-xs text-[var(--muted)] font-mono leading-relaxed mb-6">
                  {tier.description}
                </p>
                <div className="w-full h-[2px] bg-[var(--foreground)] opacity-20 mb-6" />
                <ul className="space-y-3.5 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 font-mono text-xs text-[var(--foreground)]">
                      <span className="shrink-0 text-green-500 font-black">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={tier.href}
                className="block w-full text-center font-mono text-xs font-black uppercase tracking-wider py-3 border-2 border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[3px_3px_0px_0px_var(--shadow-color)]"
              >
                {tier.buttonText}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
