import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import ConfirmModal from '../../../components/ui/ConfirmModal';

interface Tag {
  id: number;
  name: string;
}

export default function TagList() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tags');
      const data = await res.json();
      setTags(data || []);
    } catch (e) {
      toast.error('Erro ao carregar tags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    try {
      const res = await api.post('/tags', { name: newName });
      if (!res.ok) throw new Error();
      toast.success('Tag criada com sucesso!');
      setNewName('');
      fetchTags();
    } catch (e) {
      toast.error('Erro ao criar tag. Talvez já exista.');
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    try {
      const res = await api.put(`/tags/${id}`, { name: editName });
      if (!res.ok) throw new Error();
      toast.success('Tag atualizada!');
      setEditingId(null);
      fetchTags();
    } catch (e) {
      toast.error('Erro ao atualizar tag.');
    }
  };

  const handleDelete = async () => {
    if (!tagToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/tags/${tagToDelete.id}`);
      if (res.status === 409) {
        toast.error('Esta tag possui produtos vinculados e não pode ser excluída.');
        setDeleteModalOpen(false);
        return;
      }
      if (!res.ok) throw new Error();
      
      toast.success('Tag excluída com sucesso.');
      fetchTags();
      setDeleteModalOpen(false);
    } catch (e) {
      toast.error('Erro ao excluir tag.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-slate-100 mb-6">Gestão de Tags</h2>

      {/* Form Criar */}
      <div className="bg-slate-200 border border-slate-200 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-medium text-slate-600 mb-4">Nova Tag</h3>
        <form onSubmit={handleCreate} className="flex gap-4">
          <input 
            type="text" 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ex: Wi-Fi 6, Mesh, 10G..."
            className="flex-1 bg-slate-950 border border-slate-200 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand"
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
      <div className="bg-slate-200 border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-950 border-b border-slate-200 text-slate-600 text-sm">
            <tr>
              <th className="px-6 py-4 font-medium">Nome da Tag</th>
              <th className="px-6 py-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-slate-600">Carregando...</td>
              </tr>
            ) : tags.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-slate-600">Nenhuma tag encontrada.</td>
              </tr>
            ) : (
              tags.map(tag => (
                <tr key={tag.id} className="hover:bg-slate-100/20 transition-colors">
                  <td className="px-6 py-4">
                    {editingId === tag.id ? (
                      <input 
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-slate-950 border border-brand/50 rounded px-3 py-1 text-slate-200 focus:outline-none focus:border-brand w-full max-w-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdate(tag.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {tag.name}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {editingId === tag.id ? (
                        <>
                          <button onClick={() => handleUpdate(tag.id)} className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors" title="Salvar">
                            <Save size={18} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Cancelar">
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => {
                              setEditingId(tag.id);
                              setEditName(tag.name);
                            }} 
                            className="p-2 text-slate-600 hover:text-brand hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              setTagToDelete(tag);
                              setDeleteModalOpen(true);
                            }}
                            className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
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
        title="Excluir Tag"
        message={`Tem certeza que deseja excluir a tag "${tagToDelete?.name}"? Isso não removerá os produtos vinculados.`}
        confirmText="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
        isLoading={isDeleting}
      />
    </div>
  );
}
