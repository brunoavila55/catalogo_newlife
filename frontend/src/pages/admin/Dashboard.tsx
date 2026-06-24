import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Package, AlertTriangle, Image as ImageIcon, FileText, Layers } from 'lucide-react';

interface DashboardStats {
  total_products: number;
  in_stock: number;
  out_of_stock: number;
  without_images: number;
  without_specs: number;
  empty_categories: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-slate-100">Visão Geral</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl border border-slate-200 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-slate-100">Visão Geral do Catálogo</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Products */}
        <div className="bg-slate-200 p-6 rounded-xl border border-slate-200 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-600 font-medium">Total de Produtos</h3>
            <div className="p-2 bg-brand/10 text-brand rounded-lg">
              <Package size={20} />
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold text-slate-100">{stats?.total_products}</span>
            <div className="text-sm text-slate-600 mt-1">
              <span className="text-emerald-400 font-medium">{stats?.in_stock}</span> em estoque
            </div>
          </div>
        </div>

        {/* Out of stock */}
        <div className="bg-slate-200 p-6 rounded-xl border border-red-900/50 flex flex-col gap-4 relative overflow-hidden">
          <div className="flex items-center justify-between z-10">
            <h3 className="text-slate-600 font-medium">Em Falta</h3>
            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="z-10">
            <span className="text-3xl font-bold text-slate-100">{stats?.out_of_stock}</span>
            <div className="text-sm text-slate-600 mt-1">Requerem atenção</div>
          </div>
          {stats?.out_of_stock && stats.out_of_stock > 0 ? (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500"></div>
          ) : null}
        </div>

        {/* Missing Images */}
        <div className="bg-slate-200 p-6 rounded-xl border border-amber-900/50 flex flex-col gap-4 relative overflow-hidden">
          <div className="flex items-center justify-between z-10">
            <h3 className="text-slate-600 font-medium">Sem Imagem</h3>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <ImageIcon size={20} />
            </div>
          </div>
          <div className="z-10">
            <span className="text-3xl font-bold text-slate-100">{stats?.without_images}</span>
            <div className="text-sm text-slate-600 mt-1">Incompletos na vitrine</div>
          </div>
          {stats?.without_images && stats.without_images > 0 ? (
             <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500"></div>
          ) : null}
        </div>

        {/* Missing Specs */}
        <div className="bg-slate-200 p-6 rounded-xl border border-amber-900/50 flex flex-col gap-4 relative overflow-hidden">
          <div className="flex items-center justify-between z-10">
            <h3 className="text-slate-600 font-medium">Ficha Técnica Vazia</h3>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <FileText size={20} />
            </div>
          </div>
          <div className="z-10">
            <span className="text-3xl font-bold text-slate-100">{stats?.without_specs}</span>
            <div className="text-sm text-slate-600 mt-1">Faltam especificações</div>
          </div>
          {stats?.without_specs && stats.without_specs > 0 ? (
             <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500"></div>
          ) : null}
        </div>

        {/* Empty Categories */}
        <div className="bg-slate-200 p-6 rounded-xl border border-slate-200 flex flex-col gap-4 relative overflow-hidden">
          <div className="flex items-center justify-between z-10">
            <h3 className="text-slate-600 font-medium">Categorias Vazias</h3>
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <Layers size={20} />
            </div>
          </div>
          <div className="z-10">
            <span className="text-3xl font-bold text-slate-100">{stats?.empty_categories}</span>
            <div className="text-sm text-slate-600 mt-1">Sem produtos atrelados</div>
          </div>
        </div>

      </div>
    </div>
  );
}
