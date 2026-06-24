'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sun, Moon, LogIn, LogOut, UserPlus, User, ChevronDown, Menu, X } from 'lucide-react';
import { useSession } from '@/lib/session';
import { useTheme } from './ThemeProvider';
import { getAvatarUrl } from '@/lib/avatar';

export default function Navbar() {
  const { user, isLoading, logout } = useSession();
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress(height > 0 ? (winScroll / height) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    router.push('/signin');
  };

  const navItems = [
    { href: '/', label: 'Home' },
    { href: 'https://api.gnovium.com/docs', label: 'Documentation', external: true },
    { href: 'https://api.gnovium.com/docs#endpoints', label: 'API Reference', external: true },
    { href: '/pricing', label: 'Pricing' },
    { href: '/blog', label: 'Blog' },
  ];

  return (
    <>
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />
      <nav className="fixed top-0 left-0 right-0 z-40 w-full border-b border-[var(--border)] bg-[var(--nav-bg)] backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between gap-4">
            
            {/* Left - Logo */}
            <div className="flex items-center gap-6 shrink-0">
              <Link href="/" className="flex items-center gap-3 group" aria-label="Gnovium App Home">
                <div className="relative h-10 w-10 overflow-hidden rounded-none border-2 border-[var(--foreground)] bg-[var(--card-bg)] shadow-[3px_3px_0px_0px_var(--shadow-color)] transition-all group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-none flex items-center justify-center">
                  <img src="/logo/gnovium.jpeg" alt="Gnovium" className="h-full w-full object-cover" />
                </div>
                <span className="text-sm font-black tracking-widest text-[var(--foreground)] transition-colors group-hover:opacity-70 uppercase font-mono">
                  GNOVIUM <span className="text-[10px] font-black px-2 py-0.5 rounded-none bg-[var(--foreground)] text-[var(--background)] border-2 border-[var(--foreground)] ml-1 tracking-normal font-sans">APP</span>
                </span>
              </Link>
            </div>

            {/* Middle - Navigation links (Desktop) */}
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] font-black uppercase tracking-wider text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`font-mono text-[11px] font-black uppercase tracking-wider transition-colors ${
                      pathname === item.href
                        ? 'border-b-2 border-[var(--foreground)] text-[var(--foreground)] pb-1'
                        : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </div>

            {/* Right - Actions */}
            <div className="hidden md:flex items-center gap-2.5 ml-auto">
              
              {/* Creator Credit */}
              <div className="hidden xl:flex items-center gap-2 mr-2">
                <span className="font-mono text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Created by</span>
                <a
                  href="https://www.linkedin.com/in/gaurav-kaloliya-b44569417"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] font-black uppercase tracking-widest text-[var(--foreground)] hover:opacity-80 transition-opacity border-b-2 border-[var(--foreground)]"
                >
                  Gaurav Kaloliya
                </a>
              </div>
              
              <div className="hidden xl:block w-px h-4 bg-[var(--border)] mr-2" />

              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={toggle}
                  className="p-2.5 rounded-none border-2 border-[var(--border)] neo-depth-btn text-[var(--foreground)] cursor-pointer bg-[var(--card-bg)]"
                  aria-label={`Current theme: ${theme}. Click to change.`}
                  title={`Theme: ${theme}`}
                >
                  {theme === 'dark' ? (
                    <Moon className="h-4 w-4" strokeWidth={2.5} />
                  ) : theme === 'light' ? (
                    <Sun className="h-4 w-4" strokeWidth={2.5} />
                  ) : theme === 'sepia' ? (
                    <span className="text-xs font-black">S</span>
                  ) : theme === 'high-contrast' ? (
                    <span className="text-xs font-black">HC</span>
                  ) : theme === 'ocean' ? (
                    <span className="text-xs font-black">🌊</span>
                  ) : (
                    <span className="text-xs font-black">🌙</span>
                  )}
                </button>
              )}

              {/* Authentication */}
              {isLoading ? (
                <div className="h-9 w-32 border-2 border-[var(--border)] bg-[var(--sunken-bg)] animate-pulse" />
              ) : user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 border-2 border-[var(--foreground)] text-[11px] font-black font-mono uppercase tracking-wider bg-[var(--card-bg)] text-[var(--foreground)] hover:bg-[var(--code-bg)] transition-all neo-depth-btn cursor-pointer"
                  >
                    <div className="relative h-4.5 w-4.5 rounded-none border border-[var(--foreground)] overflow-hidden shrink-0 bg-[var(--sunken-bg)]">
                      <img
                        src={user.avatar_url || getAvatarUrl(user.name || user.email)}
                        alt="Profile avatar"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span>{user.name}</span>
                    <ChevronDown size={12} strokeWidth={2.5} />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-[var(--card-bg)] border-2 border-[var(--foreground)] rounded-none shadow-[3px_3px_0px_0px_var(--shadow-color)] py-1.5 z-50">
                      {/* Premium Header */}
                      <div className="flex items-center gap-2.5 px-3.5 py-2 border-b-2 border-[var(--border)] bg-[var(--sunken-bg)] mb-1.5">
                        <div className="relative h-7 w-7 rounded-none border border-[var(--foreground)] overflow-hidden shrink-0 bg-[var(--card-bg)]">
                          <img
                            src={user.avatar_url || getAvatarUrl(user.name || user.email)}
                            alt="Profile avatar"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-black font-mono uppercase text-[var(--foreground)] truncate">{user.name}</div>
                          <div className="text-[8px] font-bold font-mono text-[var(--muted)] truncate">{user.email}</div>
                        </div>
                      </div>

                      <Link
                        href="/"
                        className="block px-4 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--foreground)] hover:bg-[var(--code-bg)] transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Workspace
                      </Link>
                      <hr className="border-t-2 border-[var(--border)] my-1.5" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-1.5 text-[11px] font-mono font-black uppercase tracking-wider text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <LogOut size={12} className="inline mr-2" strokeWidth={2.5} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : pathname === '/signin' ? (
                <Link
                  href="/signup"
                  className="flex items-center gap-1.5 px-3.5 py-2 border-2 border-[var(--foreground)] text-[11px] font-black font-mono uppercase tracking-wider bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 transition-all neo-depth-btn"
                >
                  <UserPlus size={13} strokeWidth={2.5} />
                  <span>Sign Up</span>
                </Link>
              ) : (
                <Link
                  href="/signin"
                  className="flex items-center gap-1.5 px-3.5 py-2 border-2 border-[var(--foreground)] text-[11px] font-black font-mono uppercase tracking-wider bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 transition-all neo-depth-btn"
                >
                  <LogIn size={13} strokeWidth={2.5} />
                  <span>Sign In</span>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2.5 border-2 border-[var(--border)] neo-depth-btn text-[var(--foreground)] cursor-pointer bg-[var(--card-bg)]"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-4 w-4" strokeWidth={2.5} /> : <Menu className="h-4 w-4" strokeWidth={2.5} />}
            </button>

          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isOpen && (
          <div className="md:hidden border-t-2 border-[var(--border)] bg-[var(--card-bg)] px-4 py-4 space-y-4">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] font-black uppercase tracking-wider text-[var(--muted)] hover:text-[var(--foreground)] px-2 py-1.5 border border-transparent transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`font-mono text-[11px] font-black uppercase tracking-wider px-2 py-1.5 border transition-colors ${
                      pathname === item.href
                        ? 'border-[var(--foreground)] bg-[var(--sunken-bg)] text-[var(--foreground)]'
                        : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </div>

            <hr className="border-t-2 border-[var(--border)]" />

            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-black uppercase tracking-wider text-[var(--muted)]">Theme</span>
              {mounted && (
                <button
                  onClick={toggle}
                  className="p-2.5 border-2 border-[var(--border)] neo-depth-btn text-[var(--foreground)] cursor-pointer bg-[var(--card-bg)]"
                >
                  {theme === 'dark' ? (
                    <Moon className="h-4 w-4" strokeWidth={2.5} />
                  ) : theme === 'light' ? (
                    <Sun className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <span className="text-xs font-black">{theme.toUpperCase()}</span>
                  )}
                </button>
              )}
            </div>

            <hr className="border-t-2 border-[var(--border)]" />

            {isLoading ? null : user ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 px-2 py-1.5 border-b border-[var(--border)] pb-2.5 mb-1 bg-[var(--sunken-bg)]">
                  <div className="relative h-8 w-8 rounded-none border border-[var(--foreground)] overflow-hidden shrink-0 bg-[var(--card-bg)]">
                    <img
                      src={user.avatar_url || getAvatarUrl(user.name || user.email)}
                      alt="Profile avatar"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-black font-mono uppercase text-[var(--foreground)] truncate">{user.name}</div>
                    <div className="text-[9px] font-bold font-mono text-[var(--muted)] truncate">{user.email}</div>
                  </div>
                </div>
                <Link
                  href="/"
                  className="block text-center font-mono text-[11px] font-black uppercase tracking-wider py-2 border-2 border-[var(--foreground)] bg-[var(--card-bg)] text-[var(--foreground)] neo-depth-btn"
                  onClick={() => setIsOpen(false)}
                >
                  Workspace
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="block w-full text-center font-mono text-[11px] font-black uppercase tracking-wider py-2 border-2 border-rose-500 bg-rose-500/10 text-rose-500"
                >
                  Logout
                </button>
              </div>
            ) : pathname === '/signin' ? (
              <Link
                href="/signup"
                className="block text-center font-mono text-[11px] font-black uppercase tracking-wider py-2 border-2 border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] neo-depth-btn"
                onClick={() => setIsOpen(false)}
              >
                Sign Up
              </Link>
            ) : (
              <Link
                href="/signin"
                className="block text-center font-mono text-[11px] font-black uppercase tracking-wider py-2 border-2 border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] neo-depth-btn"
                onClick={() => setIsOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </nav>
    </>
  );
}