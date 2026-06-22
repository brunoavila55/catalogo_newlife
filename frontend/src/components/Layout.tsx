import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // On home page, header starts transparent over the hero
  const headerBg = isHome
    ? scrolled ? 'bg-surface-dark/80 backdrop-blur-lg border-b border-slate-800/60 shadow-lg shadow-black/20' : 'bg-transparent border-b border-transparent'
    : 'bg-surface-dark/90 backdrop-blur-lg border-b border-slate-800/60';

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {!isHome && (
        <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${headerBg}`}>
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <img src="/favicon.svg" alt="NL Logo" className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <span className="text-xl font-condensed font-bold tracking-wider">
                <span className="text-brand">New Life</span>{' '}
                <span className="text-white">Fibra</span>
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-8 text-sm uppercase tracking-wider font-semibold">
              <Link to="/catalogo" className="text-slate-300 hover:text-white transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-brand after:transition-all hover:after:w-full">
                Catálogo
              </Link>
            </nav>

            <button className="md:hidden text-slate-300" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          
          {/* Mobile Menu */}
          <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? 'max-h-48' : 'max-h-0'}`}>
            <nav className="px-6 pb-6 flex flex-col gap-4 text-sm uppercase tracking-wider font-semibold">
              <Link to="/catalogo" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-white transition-colors">
                Catálogo
              </Link>
            </nav>
          </div>
        </header>
      )}

      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>

      <footer className="relative z-20 bg-surface-dark border-t border-slate-800/60 py-10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-brand/20 flex items-center justify-center text-brand font-bold text-xs">NL</div>
              <p className="text-slate-500 text-sm">
                &copy; {new Date().getFullYear()} New Life Fibra. Catálogo interno de equipamentos.
              </p>
            </div>
            <Link 
              to="/gestor-nlf-admin" 
              className="text-xs text-slate-600 hover:text-brand transition-colors tracking-widest uppercase font-semibold"
            >
              Acesso Restrito
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
