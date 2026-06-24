import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus, ArrowRight, Trash2, Calendar, FileOutput } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

export default function ProjectsList() {
  const { projects, createProject, deleteProject, setActiveProject } = useProject();
  const navigate = useNavigate();

  const handleCreate = () => {
    const p = createProject();
    navigate(`/projetos/${p.id}`);
  };

  const handleOpen = (id: string) => {
    setActiveProject(id);
    navigate(`/projetos/${id}`);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="bg-surface-dark border-b border-slate-200/60 sticky top-0 z-30">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/catalogo" className="text-slate-600 hover:text-slate-900 transition-colors font-semibold uppercase tracking-wider text-sm">
            Voltar ao Catálogo
          </Link>
          <div className="text-right">
            <h1 className="text-2xl font-condensed text-slate-900 uppercase tracking-wider">Meus Projetos</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-condensed text-slate-900">Projetos Salvos ({projects.length})</h2>
          {projects.length > 0 && (
            <button 
              onClick={handleCreate}
              className="flex items-center gap-2 bg-brand text-white font-bold uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-brand-dark transition-all"
            >
              <Plus size={18} /> Novo Projeto
            </button>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="max-w-2xl mx-auto text-center py-20 bg-surface-dark rounded-3xl border border-slate-200/60 mt-10">
            <div className="w-24 h-24 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText size={40} className="text-brand" />
            </div>
            <h2 className="text-3xl font-condensed text-slate-900 mb-4">Nenhum projeto encontrado</h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">Você ainda não possui projetos salvos. Crie seu primeiro projeto para começar a montar suas listas de equipamentos.</p>
            <button 
              onClick={handleCreate}
              className="inline-flex items-center gap-2 bg-brand text-white font-bold uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-brand-dark transition-all"
            >
              <Plus size={20} /> Criar Primeiro Projeto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(p => (
              <div key={p.id} className="bg-surface-dark border border-slate-200/60 rounded-2xl p-6 hover:border-brand/50 transition-colors group flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-brand">
                      <FileOutput size={20} />
                    </div>
                    <div>
                      <h3 className="text-slate-900 font-bold text-lg truncate max-w-[200px]">{p.name}</h3>
                      <p className="text-slate-600 text-sm truncate max-w-[200px]">{p.clientName || 'Sem cliente'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Excluir o projeto "${p.name}"?`)) {
                        deleteProject(p.id);
                      }
                    }}
                    className="text-slate-600 hover:text-red-400 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="flex-1">
                  <p className="text-slate-600 text-sm mb-6 line-clamp-2">
                    {p.notes || 'Nenhuma observação adicionada.'}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200/60 pt-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-600 flex items-center gap-1"><Calendar size={12}/> Atualizado em:</span>
                    <span className="text-sm text-slate-600 font-medium">{new Date(p.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-xs text-slate-600">Itens:</span>
                    <span className="text-sm text-brand font-bold">{p.items.reduce((acc, i) => acc + i.quantity, 0)}</span>
                  </div>
                </div>

                <button 
                  onClick={() => handleOpen(p.id)}
                  className="w-full mt-6 flex items-center justify-center gap-2 bg-slate-100 hover:bg-brand hover:text-white text-slate-600 font-bold uppercase tracking-widest py-3 rounded-xl transition-all"
                >
                  Abrir Projeto <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
