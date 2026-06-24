import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { Package, Tag, LogOut, ExternalLink } from 'lucide-react';
import { useEffect } from 'react';

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/gestor-nlf-admin');
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const payloadBase64 = token.split('.')[1];
      const decodedJson = atob(payloadBase64);
      const payload = JSON.parse(decodedJson);
      
      if (payload.exp) {
        const expMs = payload.exp * 1000;
        const timeUntilExp = expMs - Date.now();

        if (timeUntilExp <= 0) {
          alert('Sua sessão expirou. Por favor, faça login novamente.');
          handleLogout();
        } else {
          const timeoutId = setTimeout(() => {
            alert('Sua sessão expirou. Por favor, faça login novamente.');
            handleLogout();
          }, timeUntilExp);
          return () => clearTimeout(timeoutId);
        }
      }
    } catch (e) {
      console.error('Token parsing error', e);
      handleLogout();
    }
  }, [navigate]);

  const navLinks = [
    { to: "/gestor-nlf-admin/produtos", icon: Package, label: "Produtos" },
    { to: "/gestor-nlf-admin/tags", icon: Tag, label: "Tags" },
  ];

  return (
    <div className="min-h-screen bg-white flex text-slate-900 font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-brand uppercase tracking-wider font-condensed">
            New Life <span className="text-slate-900">Admin</span>
          </h1>
        </div>
        
        <nav className="flex-1 py-6 px-3 flex flex-col gap-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive 
                    ? "bg-brand text-white shadow-lg shadow-brand/20" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                }`
              }
            >
              <link.icon size={20} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-2">
          <Link 
            to="/catalogo"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors font-semibold"
          >
            <ExternalLink size={18} />
            Ver Catálogo
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-red-400 hover:text-white hover:bg-red-500 transition-colors font-semibold"
          >
            <LogOut size={18} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-slate-50/50 border-b border-slate-200 flex items-center justify-end px-8">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-brand">
              <UserIcon />
            </div>
            Admin System
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>

    </div>
  );
}

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
