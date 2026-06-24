import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import ConfirmModal from '../../../components/ui/ConfirmModal';

interface Category {
  id: number;
  name: string;
}

export default function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      const data = await res.json();
      setCategories(data || []);
    } catch (e) {
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    try {
      const res = await api.post('/categories', { name: newName });
      if (!res.ok) throw new Error();
      toast.success('Categoria criada com sucesso!');
      setNewName('');
      fetchCategories();
    } catch (e) {
      toast.error('Erro ao criar categoria. Talvez já exista.');
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    try {
      const res = await api.put(`/categories/${id}`, { name: editName });
      if (!res.ok) throw new Error();
      toast.success('Categoria atualizada!');
      setEditingId(null);
      fetchCategories();
    } catch (e) {
      toast.error('Erro ao atualizar categoria.');
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/categories/${categoryToDelete.id}`);
      if (res.status === 409) {
        toast.error('Esta categoria possui produtos vinculados e não pode ser excluída.');
        setDeleteModalOpen(false);
        return;
      }
      if (!res.ok) throw new Error();
      
      toast.success('Categoria excluída com sucesso.');
      fetchCategories();
      setDeleteModalOpen(false);
    } catch (e) {
      toast.error('Erro ao excluir categoria.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-slate-100 mb-6">Gestão de Categorias</h2>

      {/* Form Criar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-medium text-slate-300 mb-4">Nova Categoria</h3>
        <form onSubmit={handleCreate} className="flex gap-4">
          <input 
            type="text" 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ex: Roteadores, OLT..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand"
          />
          <button 
            type="submit"
            disabled={!newName.trim()}
            className="bg-brand text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-dark transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Plus size={18} /> Adicionar
          </button>
        </form>
      </div>

      {/* Lista */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-sm">
            <tr>
              <th className="px-6 py-4 font-medium">Nome da Categoria</th>
              <th className="px-6 py-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-slate-500">Carregando...</td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-slate-500">Nenhuma categoria encontrada.</td>
              </tr>
            ) : (
              categories.map(cat => (
                <tr key={cat.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    {editingId === cat.id ? (
                      <input 
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-slate-950 border border-brand/50 rounded px-3 py-1 text-slate-200 focus:outline-none focus:border-brand w-full max-w-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdate(cat.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                    ) : (
                      <span className="text-slate-200 font-medium">{cat.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {editingId === cat.id ? (
                        <>
                          <button onClick={() => handleUpdate(cat.id)} className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors" title="Salvar">
                            <Save size={18} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors" title="Cancelar">
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => {
                              setEditingId(cat.id);
                              setEditName(cat.name);
                            }} 
                            className="p-2 text-slate-400 hover:text-brand hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              setCategoryToDelete(cat);
                              setDeleteModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Excluir Categoria"
        message={`Tem certeza que deseja excluir a categoria "${categoryToDelete?.name}"? Esta ação não afetará os produtos, mas os deixará sem categoria caso não exista validação prévia.`}
        confirmText="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
        isLoading={isDeleting}
      />
    </div>
  );
}
