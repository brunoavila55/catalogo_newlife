import { Trash2, FileText, User, FileOutput, Loader2, ArrowLeft } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { getProductThumbImage } from '../utils/image';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ProductSearchModal from '../components/ProductSearchModal';

const parsePrice = (priceStr: string | undefined): number => {
  if (!priceStr) return 0;
  const cleanStr = priceStr.replace(/[R$\s\.]/g, '').replace(',', '.');
  const val = parseFloat(cleanStr);
  return isNaN(val) ? 0 : val;
};

const formatPrice = (val: number): string => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export default function ProjectPage() {
  const { id } = useParams();
  const { projects, addItem, updateQuantity, removeItem, clearProject, updateProjectInfo, setActiveProject, deleteProject } = useProject();
  
  const activeProject = projects.find(p => p.id === id);
  const items = activeProject?.items || [];
  
  const grandTotal = items.reduce((acc, item) => {
    const itemPrice = parsePrice(item.product.specs_json?.['_price']);
    return acc + (itemPrice * item.quantity);
  }, 0);

  const [loading, setLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      setActiveProject(id);
    }
  }, [id, setActiveProject]);

  if (!activeProject) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
        <h2 className="text-2xl text-slate-900 mb-4">Projeto não encontrado</h2>
        <Link to="/projetos" className="text-brand hover:underline">Voltar para meus projetos</Link>
      </div>
    );
  }

  const handleGeneratePDF = async () => {
    if (items.length === 0) return;
    
    setLoading(true);
    try {
      const payload = {
        project_name: activeProject.name,
        client_name: activeProject.clientName,
        responsible: activeProject.responsible,
        notes: activeProject.notes,
        items: items.map(i => ({
          product_id: i.product.id,
          quantity: i.quantity
        }))
      };

      const res = await api.post('/projects/pdf', payload);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || 'Erro ao gerar PDF do projeto.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `projeto-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF gerado com sucesso!');
      
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="bg-surface-dark border-b border-slate-200/60 sticky top-0 z-30">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/projetos" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-semibold uppercase tracking-wider text-sm">
            <ArrowLeft size={18} /> Voltar para a lista
          </Link>
          <div className="text-right">
            <h1 className="text-2xl font-condensed text-slate-900 uppercase tracking-wider truncate max-w-[200px] sm:max-w-sm">{activeProject.name}</h1>
            <p className="text-sm text-brand font-bold">{items.length} {items.length === 1 ? 'item' : 'itens'}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-12">
        {items.length === 0 ? (
          <div className="max-w-2xl mx-auto text-center py-20 bg-surface-dark rounded-3xl border border-slate-200/60">
            <div className="w-24 h-24 bg-slate-100/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText size={40} className="text-slate-600" />
            </div>
            <h2 className="text-3xl font-condensed text-slate-900 mb-4">Projeto vazio</h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">Busque e adicione equipamentos para começar a montar a sua lista técnica.</p>
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="inline-flex items-center gap-2 bg-brand text-white font-bold uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-brand-dark transition-all"
            >
              Adicionar Primeiro Equipamento
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Lista de Itens */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-bold text-slate-600 uppercase tracking-widest border-b border-slate-200 pb-4 mb-6">Itens Selecionados</h3>
              {items.map(item => {
                const thumb = getProductThumbImage(item.product);
                const unitPrice = parsePrice(item.product.specs_json?.['_price']);
                const subtotal = unitPrice * item.quantity;
                return (
                  <div key={item.product.id} className="flex gap-6 items-center bg-surface-dark p-4 sm:p-6 rounded-2xl border border-slate-200/60 hover:border-brand/30 transition-colors group">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-surface rounded-xl p-2 border border-slate-300/50 flex-shrink-0">
                      {thumb ? <img src={thumb} alt={item.product.name} className="w-full h-full object-contain" /> : <div className="w-full h-full bg-slate-100 rounded"></div>}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-slate-200 truncate group-hover:text-brand transition-colors">{item.product.name}</h4>
                        <p className="text-sm text-slate-600 mb-4">{item.product.brand}</p>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center bg-surface border border-slate-300 rounded-lg">
                            <button 
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="px-3 py-1.5 text-slate-600 hover:text-slate-900"
                            >-</button>
                            <span className="text-sm font-bold text-slate-900 px-3 min-w-[2.5rem] text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="px-3 py-1.5 text-slate-600 hover:text-slate-900"
                            >+</button>
                          </div>
                          <button 
                            onClick={() => removeItem(item.product.id)}
                            className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-400 transition-colors font-medium"
                          >
                            <Trash2 size={16} /> <span className="hidden sm:inline">Remover</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="sm:text-right flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end border-t sm:border-t-0 sm:border-l border-slate-200/60 pt-4 sm:pt-0 sm:pl-6">
                        <div className="text-sm text-slate-600 mb-1">Valor Unit.</div>
                        <div className="text-slate-600 font-medium">{formatPrice(unitPrice)}</div>
                        <div className="text-sm text-slate-600 mt-2 mb-1 hidden sm:block">Subtotal</div>
                        <div className="text-lg text-slate-900 font-bold">{formatPrice(subtotal)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <div className="pt-4 flex justify-between items-center">
                 <button 
                   onClick={() => setIsSearchOpen(true)}
                   className="inline-flex items-center gap-2 text-brand hover:text-slate-900 transition-colors font-bold uppercase tracking-wider text-sm"
                 >
                   + Adicionar mais equipamentos
                 </button>
                 <button
                   onClick={() => {
                     if (window.confirm('Tem certeza que deseja excluir este projeto permanentemente?')) {
                       deleteProject(activeProject.id);
                       navigate('/projetos');
                     }
                   }}
                   className="px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg font-bold uppercase tracking-wider text-xs transition-all"
                 >
                   Excluir Projeto
                 </button>
              </div>
            </div>

            {/* Painel Lateral de Finalização */}
            <div className="lg:col-span-1">
              <div className="bg-surface-dark border border-slate-200/60 rounded-3xl p-6 sm:p-8 sticky top-28">
                <h3 className="text-lg font-bold text-slate-600 uppercase tracking-widest border-b border-slate-200 pb-4 mb-6">Detalhes do Projeto</h3>
                
                <div className="space-y-5 mb-8">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2 flex items-center gap-2">
                      <FileText size={16} /> Nome do Projeto
                    </label>
                    <input 
                      type="text" 
                      value={activeProject.name}
                      onChange={e => updateProjectInfo(activeProject.id, { name: e.target.value })}
                      placeholder="Ex: Expansão Bairro Centro"
                      className="w-full bg-surface border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2 flex items-center gap-2">
                      <User size={16} /> Nome do Cliente
                    </label>
                    <input 
                      type="text" 
                      value={activeProject.clientName}
                      onChange={e => updateProjectInfo(activeProject.id, { clientName: e.target.value })}
                      placeholder="Opcional"
                      className="w-full bg-surface border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2 flex items-center gap-2">
                      <User size={16} /> Responsável
                    </label>
                    <input 
                      type="text" 
                      value={activeProject.responsible || ''}
                      onChange={e => updateProjectInfo(activeProject.id, { responsible: e.target.value })}
                      placeholder="Nome de quem gerou (Opcional)"
                      className="w-full bg-surface border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2">Observações</label>
                    <textarea 
                      value={activeProject.notes}
                      onChange={e => updateProjectInfo(activeProject.id, { notes: e.target.value })}
                      placeholder="Informações adicionais..."
                      rows={4}
                      className="w-full bg-surface border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-brand resize-none"
                    />
                  </div>
                </div>

                <div className="bg-surface rounded-2xl p-5 mb-8 border border-slate-200/60 flex flex-col gap-2">
                  <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">Resumo Financeiro</div>
                  <div className="text-3xl font-condensed text-brand font-bold">{formatPrice(grandTotal)}</div>
                </div>

                <button 
                  onClick={handleGeneratePDF}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-brand text-white font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-brand-dark transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <FileOutput size={20} />}
                  Gerar PDF
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja limpar todos os itens?')) clearProject();
                  }}
                  className="w-full text-center mt-6 text-sm font-bold text-slate-600 hover:text-red-400 transition-colors"
                >
                  Esvaziar Projeto
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <ProductSearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onAdd={(product, qty) => { 
          addItem(product, qty); 
          toast.success('Adicionado!'); 
          setIsSearchOpen(false); 
        }} 
      />
    </div>
  );
}
