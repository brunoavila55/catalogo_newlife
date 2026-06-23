import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { X, ExternalLink, Search, ChevronLeft, ChevronRight, Trash2, PlusCircle, CheckCircle2, Zap, SlidersHorizontal, FolderPlus } from 'lucide-react';
import FocusTrap from 'focus-trap-react';
import { useCompare } from '../context/CompareContext';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import { getProductMainImage, getProductSecondImage } from '../utils/image';

export default function Catalog() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('categoria') || 'Todos');
  const [selectedType, setSelectedType] = useState<string>('Todos');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const { compareList, addToCompare, removeFromCompare } = useCompare();
  const { addItem } = useProject();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  
  const [showFilters, setShowFilters] = useState(false);
  const gridRef = useRef(null);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [tagRes, typesRes, catRes] = await Promise.all([
          api.get('/tags'),
          api.get('/types'),
          api.get('/categories')
        ]);
        setTags(await tagRes.json() || []);
        setProductTypes(await typesRes.json() || []);
        setCategories(await catRes.json() || []);
      } catch (e) {
        console.error("Erro ao buscar filtros", e);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const cat = searchParams.get('categoria');
    if (cat) {
      setSelectedCategory(cat);
      // Opcional: Expandir os filtros se vier com categoria selecionada na URL
      if (!showFilters) setShowFilters(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', '12');
        if (searchQuery) params.append('q', searchQuery);
        
        const pRes = await api.get(`/products?${params.toString()}`);
        const pData = await pRes.json();
        
        setProducts(pData.data || []);
        setTotalPages(pData.total_pages || 1);
        setTotalProducts(pData.total || 0);
      } catch (e) {
        console.error("Erro ao buscar produtos", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [page, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchInput);
  };

  const toggleTagFilter = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'Todos' && p.category !== selectedCategory) return false;
    if (selectedType !== 'Todos' && (!p.specs_json || p.specs_json['_type'] !== selectedType)) return false;
    if (selectedTags.length > 0) {
      const productTags = p.tags || [];
      const hasAllTags = selectedTags.every(st => productTags.includes(st));
      if (!hasAllTags) return false;
    }
    return true;
  });

  useEffect(() => {
    if (!loading && filteredProducts.length > 0) {
      let ctx = gsap.matchMedia();
      ctx.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(".product-card", 
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, stagger: 0.06, duration: 0.4, ease: "power2.out" }
        );
      });
      return () => ctx.revert();
    }
  }, [loading, selectedCategory, selectedType, selectedTags.length, page]);

  const clearFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setSelectedCategory('Todos');
    setSelectedType('Todos');
    setSelectedTags([]);
    setPage(1);
  };

  const activeFiltersCount = (selectedCategory !== 'Todos' ? 1 : 0) + (selectedType !== 'Todos' ? 1 : 0) + selectedTags.length;

  return (
    <div className="container mx-auto px-6 pt-24 pb-16 font-sans relative min-h-screen">
      
      {/* Page Header */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <span className="text-brand text-xs font-bold uppercase tracking-[0.2em] block mb-2">Explore nossa linha</span>
            <h1 className="text-4xl md:text-5xl text-white font-condensed">Catálogo de Equipamentos</h1>
            {!loading && <p className="text-slate-500 mt-2 text-sm">{totalProducts} equipamentos no catálogo</p>}
          </div>
          
          {/* Search */}
          <form onSubmit={handleSearch} className="relative w-full md:w-80">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou modelo..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-surface border border-slate-800/60 text-white pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-all placeholder:text-slate-600"
            />
          </form>
        </div>
      </div>

      {/* Filter Toggle Button (mobile friendly) */}
      <div className="mb-6">
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${showFilters ? 'bg-brand/10 border-brand/30 text-brand' : 'bg-surface border-slate-800/60 text-slate-400 hover:text-white hover:border-slate-700'}`}
        >
          <SlidersHorizontal size={16} />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-brand text-white text-[10px] flex items-center justify-center font-bold">{activeFiltersCount}</span>
          )}
        </button>
      </div>
      
      {/* Filters Panel */}
      <div className={`overflow-hidden transition-all duration-300 ${showFilters ? 'max-h-96 mb-8' : 'max-h-0'}`}>
        <div className="glass rounded-2xl p-6 space-y-5">
          {/* Categories */}
          <div>
            <span className="text-xs uppercase tracking-[0.15em] text-slate-500 font-bold block mb-3">Categorias</span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button 
                onClick={() => setSelectedCategory('Todos')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all whitespace-nowrap ${selectedCategory === 'Todos' ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20' : 'bg-surface-dark border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'}`}
              >
                Todos
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all whitespace-nowrap ${selectedCategory === cat.name ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20' : 'bg-surface-dark border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Types */}
          {productTypes.length > 0 && (
            <div>
              <span className="text-xs uppercase tracking-[0.15em] text-slate-500 font-bold block mb-3">Tipo de Equipamento</span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button 
                  onClick={() => setSelectedType('Todos')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all whitespace-nowrap ${selectedType === 'Todos' ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20' : 'bg-surface-dark border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'}`}
                >
                  Todos
                </button>
                {productTypes.map(tName => (
                  <button 
                    key={tName}
                    onClick={() => setSelectedType(tName)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all whitespace-nowrap ${selectedType === tName ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20' : 'bg-surface-dark border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'}`}
                  >
                    {tName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <span className="text-xs uppercase tracking-[0.15em] text-slate-500 font-bold block mb-3">Tags</span>
              <div className="flex gap-2 flex-wrap">
                {tags.map(t => (
                  <button
                    key={t.id}
                    onClick={() => toggleTagFilter(t.name)}
                    className={`px-3 py-1.5 text-xs font-semibold border rounded-full transition-all ${selectedTags.includes(t.name) ? 'bg-white text-surface-dark border-white' : 'bg-transparent text-slate-500 border-slate-700 hover:border-slate-500 hover:text-white'}`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeFiltersCount > 0 && (
            <button onClick={clearFilters} className="text-red-400 hover:text-red-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1 transition-colors">
              <Trash2 size={14} /> Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 min-h-[400px]">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-surface border border-slate-800/60">
              <div className="aspect-[4/3] animate-shimmer"></div>
              <div className="p-5 space-y-3">
                <div className="h-3 w-16 animate-shimmer rounded"></div>
                <div className="h-5 w-3/4 animate-shimmer rounded"></div>
                <div className="h-3 w-1/2 animate-shimmer rounded"></div>
              </div>
            </div>
          ))
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
              <Search size={28} className="text-slate-600" />
            </div>
            <p className="text-slate-400 mb-2 text-lg font-medium">Nenhum equipamento encontrado</p>
            <p className="text-slate-600 text-sm mb-6">Tente ajustar seus filtros ou buscar por outro termo.</p>
            <button 
              onClick={clearFilters}
              className="flex items-center gap-2 bg-surface border border-slate-700 hover:border-brand text-slate-300 hover:text-white px-5 py-2.5 rounded-xl transition-all text-sm font-semibold"
            >
              <Trash2 size={14} /> Limpar filtros
            </button>
          </div>
        ) : (
          filteredProducts.map((p) => {
            const mainImg = getProductMainImage(p);
            const secondImg = getProductSecondImage(p);
            const hasImage = Boolean(mainImg);
            const hasSecondImage = Boolean(secondImg);
            const isInCompare = compareList.find(c => c.id === p.id);

            return (
              <div key={p.id} className="product-card group relative rounded-2xl overflow-hidden bg-surface border border-slate-800/60 hover:border-brand/40 transition-all duration-500 hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1 cursor-pointer" onClick={() => navigate(`/produto/${p.slug}`)}>
                <div className="aspect-[4/3] bg-surface-dark relative overflow-hidden">
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
                  
                  {/* Compare button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isInCompare) removeFromCompare(p.id);
                      else addToCompare(p);
                    }}
                    className={`absolute top-3 right-3 p-2 rounded-lg transition-all backdrop-blur-sm ${isInCompare ? 'bg-brand text-white border border-brand' : 'bg-slate-900/70 text-slate-400 border border-slate-700/50 opacity-0 group-hover:opacity-100 hover:text-white hover:border-slate-500'}`}
                    title={isInCompare ? "Remover do comparativo" : "Adicionar ao comparativo"}
                  >
                    {isInCompare ? <CheckCircle2 size={16} /> : <PlusCircle size={16} />}
                  </button>

                  {/* Add to project button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      addItem(p, 1);
                      toast.success('Adicionado ao projeto!');
                    }}
                    className="absolute top-14 right-3 p-2 rounded-lg transition-all backdrop-blur-sm bg-slate-900/70 text-slate-400 border border-slate-700/50 opacity-0 group-hover:opacity-100 hover:text-emerald-400 hover:border-emerald-500"
                    title="Adicionar ao Projeto"
                  >
                    <FolderPlus size={16} />
                  </button>

                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>

                <div className="p-5">
                  <span className="text-[11px] text-brand font-bold uppercase tracking-[0.15em] block mb-1.5">{p.category}</span>
                  <h3 className="text-base text-white font-condensed group-hover:text-brand transition-colors duration-300">{p.name}</h3>
                  <span className="text-sm text-slate-500">{p.brand}</span>
                  
                  {p.tags && p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {p.tags.slice(0, 3).map((t: string) => (
                        <span key={t} className="px-2 py-0.5 bg-slate-800/60 text-[10px] uppercase tracking-wider text-slate-400 rounded-md border border-slate-700/50">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center mt-14 gap-2">
          <button 
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="p-3 rounded-xl bg-surface border border-slate-800/60 text-white disabled:opacity-30 hover:bg-slate-800 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          
          <div className="flex gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold text-sm transition-all ${page === i + 1 ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-surface border border-slate-800/60 text-slate-400 hover:text-white hover:border-slate-600'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button 
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="p-3 rounded-xl bg-surface border border-slate-800/60 text-white disabled:opacity-30 hover:bg-slate-800 transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
