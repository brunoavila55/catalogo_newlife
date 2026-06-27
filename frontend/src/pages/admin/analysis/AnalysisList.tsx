import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Search, Edit, Trash2, ShieldCheck, Activity } from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

interface Analysis {
  id: number;
  product_id: number;
  product_name?: string;
  product_slug?: string;
  created_at: string;
}

export default function AnalysisList() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const toast = useToast();

  const fetchAnalyses = async () => {
    try {
      const res = await api.get('/analysis');
      if (res.ok) {
        setAnalyses(await res.json() || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao buscar análises');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    fetchAnalyses();
  }, []);

  const handleDelete = async (productId: number) => {
    if (!window.confirm('Tem certeza que deseja remover esta análise? O equipamento deixará de ser Homologado.')) return;
    
    try {
      const res = await api.delete(`/analysis/${productId}`);
      if (res.ok) {
        toast.success('Análise removida com sucesso');
        fetchAnalyses();
      } else {
        toast.error('Erro ao remover análise');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro de conexão');
    }
  };

  const filtered = analyses.filter(a => 
    !search || (a.product_name && a.product_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl text-slate-900 font-condensed mb-1 flex items-center gap-2">
            <Activity className="text-brand" size={28} /> Análises e Desempenho
          </h1>
          <p className="text-slate-600">Gerencie a homologação e testes de velocidade dos equipamentos</p>
        </div>
        <Link 
          to="/gestor-nlf-admin/analise/novo"
          className="bg-brand text-slate-900 hover:bg-brand-light font-bold py-2.5 px-5 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-brand/20"
        >
          <PlusCircle size={20} />
          Nova Análise
        </Link>
      </div>

      <div className="bg-surface rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-200/60 flex items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome do produto..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-dark border border-slate-200 rounded-lg focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20 text-slate-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-4 font-semibold">Produto</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Data Cadastro</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    <div className="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full mx-auto mb-2"></div>
                    Carregando análises...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    Nenhuma análise encontrada.
                  </td>
                </tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-900">{a.product_name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-1 rounded-md flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider w-fit">
                      <ShieldCheck size={14} /> Homologado
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(a.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link 
                        to={`/gestor-nlf-admin/analise/${a.product_id}/editar`}
                        className="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(a.product_id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
