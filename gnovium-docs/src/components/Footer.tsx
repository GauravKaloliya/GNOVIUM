export default function Footer() {
  return (
    <footer className="mt-auto border-t-[3px] border-white bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between h-20 gap-4 py-4">

          {/* Copyright */}
          <p className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-white/70 text-center md:text-left">
            © {new Date().getFullYear()} GNOVIUM
          </p>

          {/* Creator Credit - Same style as Navbar */}
          <div className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-4 md:gap-6 justify-center">
            <span className="opacity-70">CREATED BY</span>
            
            <a
              href="https://www.linkedin.com/in/gauravkaloliya225"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors border-b border-white/30 hover:border-white pb-px"
            >
              GAURAV KALOLIYA
            </a>

            <span className="opacity-40">•</span>

            <a
              href="https://github.com/GauravKaloliya/gnovium"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1.5 group"
            >
              GITHUB
              <span className="text-xs opacity-60 group-hover:opacity-100">↗</span>
            </a>
          </div>

          {/* Optional: Version */}
          <div className="text-[10px] font-mono text-white/50 hidden md:block">
            API v1.0.0
          </div>
        </div>
      </div>
    </footer>
  );
}