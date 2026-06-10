'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      }
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        transform: 'translateX(-50%)',
        zIndex: 99999,
      }}
      className="
        border-[3px]
        border-white
        bg-zinc-950
        px-4
        py-3
        text-white
        font-mono
        font-black
        tracking-widest
        flex
        items-center
        gap-2
      "
    >
      <ArrowUp size={14} />
    </button>
  );
}