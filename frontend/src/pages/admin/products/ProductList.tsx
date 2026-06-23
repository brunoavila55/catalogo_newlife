import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, Filter, ImageIcon, ChevronLeft, ChevronRight, Package, Copy } from 'lucide-react';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { getProductThumbImage } from '../../../utils/image';

interface Product {
  id: number;
  slug: string;
  name: string;
  brand: string;
  category: string;
  status: string;
  image_url: string;
  images_json?: string[];
}

interface PaginationData {
  total: number;
  page: number;
  total_pages: number;
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({ total: 0, page: 1, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (debouncedSearch) params.append('q', debouncedSearch);
      if (filter) params.append('filter', filter);

      const res = await api.get(`/products?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Erro HTTP ${res.status}`);
      }
      const data = await res.json();
      setProducts(data.data || []);
      setPagination({ total: data.total, page: data.page, total_pages: data.total_pages });
    } catch (e: any) {
      toast.error(`Erro ao carregar produtos: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, filter, page]);

  const handleDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/products/${productToDelete.id}`);
      if (!res.ok) throw new Error();
      
      toast.success('Produto excluído com sucesso.');
      fetchProducts();
      setDeleteModalOpen(false);
    } catch (e) {
      toast.error('Erro ao excluir produto.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (product: Product) => {
    try {
      const res = await api.get(`/products/${product.slug}`);
      if (res.ok) {
        const fullProduct = await res.json();
        navigate('/gestor-nlf-admin/produtos/novo', { state: { cloneData: fullProduct } });
      } else {
        toast.error("Erro ao buscar dados do produto para clonar.");
      }
    } catch (e) {
      toast.error("Erro ao tentar duplicar.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-100">Produtos</h2>
        <button 
          onClick={() => navigate('/gestor-nlf-admin/produtos/novo')}
          className="bg-brand text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-dark transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={18} /> Novo Produto
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-brand"
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <select 
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-brand appearance-none"
          >
            <option value="">Todos os status</option>
            <option value="in-stock">Em estoque</option>
            <option value="out-of-stock">Em falta</option>
            <option value="no-image">Sem imagem</option>
            <option value="no-specs">Ficha técnica vazia</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Produto</th>
                <th className="px-6 py-4 font-medium">Categoria</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4 flex gap-4 items-center">
                      <div className="w-12 h-12 bg-slate-800 rounded-lg"></div>
                      <div className="flex flex-col gap-2">
                        <div className="h-4 w-32 bg-slate-800 rounded"></div>
                        <div className="h-3 w-20 bg-slate-800 rounded"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-800 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-800 rounded-full"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 w-16 bg-slate-800 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <Package size={32} className="text-slate-600" />
                      <p>Nenhum produto encontrado.</p>
                      {(search || filter) && (
                        <button onClick={() => { setSearch(''); setFilter(''); }} className="text-brand hover:underline mt-2">
                          Limpar filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map(product => {
                  const thumbUrl = getProductThumbImage(product);
                  return (
                    <tr key={product.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                            {thumbUrl ? (
                              <img src={thumbUrl} alt={product.name} className="w-full h-full object-contain p-1" />
                            ) : (
                              <ImageIcon size={20} className="text-slate-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-slate-200 font-medium">{product.name}</p>
                            <p className="text-slate-500 text-sm">{product.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.status === 'Em estoque' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleDuplicate(product)}
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                            title="Duplicar"
                          >
                            <Copy size={18} />
                          </button>
                          <button 
                            onClick={() => navigate(`/gestor-nlf-admin/produtos/${product.id}/editar`)}
                            className="p-2 text-slate-400 hover:text-brand hover:bg-slate-800 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              setProductToDelete(product);
                              setDeleteModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && pagination.total_pages > 1 && (
          <div className="border-t border-slate-800 p-4 flex items-center justify-between text-sm text-slate-400">
            <div>
              Mostrando página {pagination.page} de {pagination.total_pages} ({pagination.total} produtos)
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
                disabled={page === pagination.total_pages}
                className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Excluir Produto"
        message={`Tem certeza que deseja excluir o produto "${productToDelete?.name}"? Esta ação removerá o produto do catálogo público.`}
        confirmText="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
        isLoading={isDeleting}
      />
    </div>
  );
}
