import { useState, useEffect } from 'react';
import { X, Search, PlusCircle, Zap, Filter } from 'lucide-react';
import { api } from '../services/api';
import { getProductMainImage, getProductSecondImage } from '../utils/image';

interface ProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: any, quantity: number) => void;
}

export default function ProductSearchModal({ isOpen, onClose, onAdd }: ProductSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await api.get('/types');
        if (res.ok) {
          const data = await res.json();
          setCategories(data || []);
        }
      } catch (err) {
        console.error("Erro ao buscar filtros no modal", err);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSelectedCategory('Todos');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const urlParams = new URLSearchParams();
        urlParams.append('limit', '50');
        if (query.trim()) urlParams.append('q', query.trim());
        if (selectedCategory !== 'Todos') urlParams.append('category', selectedCategory);

        const url = `/products?${urlParams.toString()}`;
          
        const res = await api.get(url);
        if (res.ok) {
          const data = await res.json();
          setResults(data.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, query.trim() ? 400 : 0);

    return () => clearTimeout(timeoutId);
  }, [query, selectedCategory, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-surface border border-slate-700 w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-2xl font-condensed text-white uppercase tracking-wider">Catálogo de Equipamentos</h2>
            <p className="text-sm text-slate-400">Selecione os equipamentos para adicionar ao projeto</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        {/* Filters & Search */}
        <div className="p-6 border-b border-slate-800 shrink-0 bg-surface-dark/30 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Pesquise por nome, marca ou modelo..." 
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-surface-dark border border-slate-700 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              autoFocus
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <button
              onClick={() => setSelectedCategory('Todos')}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all ${selectedCategory === 'Todos' ? 'bg-brand text-white' : 'bg-surface border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'}`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-brand text-white' : 'bg-surface border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface-dark/50">
          {loading ? (
            <div className="flex justify-center items-center h-full min-h-[200px]">
              <div className="animate-spin w-10 h-10 border-3 border-brand border-t-transparent rounded-full"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {results.map(p => {
                const mainImg = getProductMainImage(p);
                const secondImg = getProductSecondImage(p);
                const hasImage = Boolean(mainImg);
                const hasSecondImage = Boolean(secondImg);

                return (
                  <div key={p.id} className="group relative rounded-2xl overflow-hidden bg-surface border border-slate-800/60 hover:border-brand/40 transition-all duration-500 hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1 flex flex-col">
                    <div className="aspect-[4/3] bg-surface-dark relative overflow-hidden shrink-0">
                      {hasImage ? (
                        <>
                          <img src={mainImg} alt={p.name} loading="lazy" decoding="async" className="w-full h-full object-contain p-4 transition-all duration-700 group-hover:scale-105" />
                          {hasSecondImage && (
                            <img src={secondImg} alt={p.name + ' verso'} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-contain p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Zap size={32} className="text-slate-700" /></div>
                      )}
                      
                      {/* Status badge */}
                      <div className="absolute top-2 left-2">
                        {p.status === 'Em estoque' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 backdrop-blur-sm border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Em estoque
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 backdrop-blur-sm border border-red-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                            Em falta
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                      <span className="text-[10px] text-brand font-bold uppercase tracking-[0.15em] block mb-1">{p.category}</span>
                      <h3 className="text-sm text-white font-condensed group-hover:text-brand transition-colors duration-300 mb-1 line-clamp-2">{p.name}</h3>
                      <span className="text-xs text-slate-500 mt-auto pb-3 block">{p.brand}</span>
                      
                      <button 
                        onClick={() => onAdd(p, 1)}
                        className="w-full flex items-center justify-center gap-2 bg-brand/10 text-brand hover:bg-brand hover:text-white py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border border-brand/20 mt-auto"
                      >
                        <PlusCircle size={16} /> Adicionar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                <Filter size={24} className="text-slate-500" />
              </div>
              <h3 className="text-xl font-condensed text-white mb-2">Nenhum equipamento encontrado</h3>
              <p className="text-slate-500 max-w-sm">Não localizamos nenhum item para "{query}" nesta categoria.</p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
