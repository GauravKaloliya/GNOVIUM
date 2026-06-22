'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="flex-1 w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8"
    >
      {children}
    </motion.main>
  );
}
