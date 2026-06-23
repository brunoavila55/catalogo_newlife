import { Link } from 'react-router-dom';
import { ArrowRight, Home as HomeIcon, Building2, Cable, Server } from 'lucide-react';

export default function Home() {
  const categories = [
    { name: 'Residencial', icon: HomeIcon, desc: 'Equipamentos para casa e pequenos negócios' },
    { name: 'Empresarial', icon: Building2, desc: 'Soluções robustas para médias e grandes empresas' },
    { name: 'FTTH', icon: Cable, desc: 'Infraestrutura de fibra óptica de ponta a ponta' },
    { name: 'Datacenter', icon: Server, desc: 'Alta performance para servidores e provedores' }
  ];

  return (
    <div className="font-sans flex flex-col min-h-screen bg-surface-dark">
      {/* Hero Section Simplificada e Leve */}
      <section className="relative w-full pt-32 pb-20 md:pt-40 md:pb-28 flex flex-col items-center justify-center overflow-hidden border-b border-slate-800/60">
        {/* Glow Decorativo Estático (CSS puro, muito leve) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-brand/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center">
          <img src="/logo-front.svg" alt="New Life Fibra" className="w-48 md:w-56 mb-8 drop-shadow-2xl" />
          
          <h1 className="text-5xl md:text-7xl text-white font-condensed mb-6 tracking-wide drop-shadow-md">
            Soluções em Conectividade
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
            Explore nosso catálogo completo de equipamentos para infraestrutura de redes residenciais, empresariais, FTTH e datacenter.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              to="/catalogo"
              className="bg-brand text-white font-bold uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-brand-dark transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Explorar Catálogo
              <ArrowRight size={18} />
            </Link>
            <Link 
              to="/projetos"
              className="bg-surface border border-slate-700 text-slate-300 font-bold uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-slate-800 hover:text-white transition-all hover:-translate-y-1 flex items-center justify-center"
            >
              Monte seu Projeto
            </Link>
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <section className="relative z-10 bg-surface-dark flex-grow flex flex-col">
        <div className="container mx-auto px-6 py-20">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-14 gap-4">
            <div>
              <span className="text-brand text-xs font-bold uppercase tracking-[0.2em] block mb-3">Nosso portfólio</span>
              <h2 className="text-4xl md:text-5xl text-white font-condensed">Principais Segmentos</h2>
            </div>
            <Link 
              to="/catalogo" 
              className="group flex items-center gap-2 text-brand hover:text-brand-light font-bold uppercase tracking-wider text-sm transition-colors"
            >
              Ver catálogo completo 
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, i) => (
              <Link
                key={cat.name}
                to={`/catalogo?categoria=${cat.name}`}
                className="group relative rounded-2xl overflow-hidden bg-surface border border-slate-800/60 hover:border-brand/50 transition-all duration-300 hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1 p-8 flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center text-brand mb-6 group-hover:scale-110 group-hover:bg-brand/10 transition-all duration-300">
                  <cat.icon size={32} />
                </div>
                <h3 className="text-xl text-white font-condensed group-hover:text-brand transition-colors duration-300 mb-3">{cat.name}</h3>
                <p className="text-slate-400 text-sm">{cat.desc}</p>
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            ))}
          </div>

          {/* CTA Monte seu Projeto */}
          <div className="mt-20 border border-slate-800/60 bg-surface rounded-3xl p-10 md:p-14 text-center relative overflow-hidden group">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand/5 rounded-full blur-3xl pointer-events-none scale-0 group-hover:scale-100 transition-transform duration-700 ease-out"></div>
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <h3 className="text-4xl md:text-5xl text-white font-condensed mb-10">Monte seu Projeto</h3>
              
              <Link
                to="/projetos"
                className="inline-flex items-center justify-center gap-3 bg-brand text-white font-bold uppercase tracking-widest px-8 py-5 rounded-2xl hover:bg-brand-dark transition-all duration-300 hover:shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:-translate-y-1 w-full sm:w-auto text-sm md:text-base"
              >
                Projetos
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
