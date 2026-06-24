import { useEffect, useState } from 'react';
import { useCompare } from '../context/CompareContext';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Zap } from 'lucide-react';
import { getProductMainImage } from '../utils/image';

const KEY_LABELS: Record<string, string> = {
  '_type': 'Tipo de Equipamento',
  '_price': 'Preço Estimado',
  '_stock_count': 'Quantidade em Estoque',
  '_net_wifi': 'Padrão Wi-Fi',
  '_net_freq': 'Frequência / Largura de Banda',
  '_net_ports': 'Portas Disponíveis',
  '_net_speed': 'Classe / Velocidade',
  '_net_power': 'Alimentação',
  '_net_mgmt': 'Gerenciamento',
  '_net_antennas': 'Antenas'
};

export default function Compare() {
  const { compareList, removeFromCompare } = useCompare();
  const navigate = useNavigate();
  const [allKeys, setAllKeys] = useState<string[]>([]);

  useEffect(() => {
    if (compareList.length < 2) {
      navigate('/catalogo');
    }
  }, [compareList, navigate]);

  useEffect(() => {
    const keys = new Set<string>();
    compareList.forEach(p => {
      if (p.specs_json) {
        Object.keys(p.specs_json).forEach(k => keys.add(k));
      }
    });
    setAllKeys(Array.from(keys).sort());
  }, [compareList]);

  if (compareList.length < 2) return null;

  return (
    <div className="container mx-auto px-6 pt-24 pb-32 font-sans">
      <Link to="/catalogo" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors text-sm font-medium">
        <ArrowLeft size={16} /> Voltar ao catálogo
      </Link>

      <h1 className="text-4xl text-slate-900 font-condensed mb-10">Comparativo de Equipamentos</h1>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/60">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr>
              <th className="p-5 bg-surface-dark border-b border-slate-200/60 w-44 sticky left-0 z-10"></th>
              {compareList.map(p => {
                const mainImg = getProductMainImage(p);
                return (
                <th key={p.id} className="p-6 bg-surface border-b border-l border-slate-200/60 align-top">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[11px] text-brand font-bold uppercase tracking-[0.15em]">{p.category}</span>
                    <button 
                      onClick={() => removeFromCompare(p.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-400/10"
                      title="Remover"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="aspect-square bg-surface-dark rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                    {mainImg ? (
                      <img src={mainImg} className="w-full h-full object-contain p-4" alt={p.name} />
                    ) : (
                      <Zap size={28} className="text-slate-700" />
                    )}
                  </div>
                  <h3 className="text-lg text-slate-900 font-condensed mb-1">{p.name}</h3>
                  <p className="text-sm text-slate-600 mb-4">{p.brand}</p>
                  <Link 
                    to={`/produto/${p.slug}`}
                    className="block text-center w-full py-2.5 bg-surface-dark border border-slate-200 hover:border-brand text-slate-900 text-xs font-bold uppercase tracking-widest rounded-lg transition-all hover:bg-brand/5"
                  >
                    Ver Detalhes
                  </Link>
                </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* Status & Tags */}
            <tr className="bg-surface-dark/60">
              <td colSpan={4} className="p-4 border-b border-slate-200/60 font-condensed text-lg text-brand uppercase sticky left-0 z-10 bg-surface-dark/60">Status & Tags</td>
            </tr>
            <tr>
              <td className="p-4 border-b border-slate-200/40 bg-surface-dark font-semibold text-sm text-slate-600 sticky left-0 z-10">Status</td>
              {compareList.map(p => (
                <td key={p.id} className="p-4 border-b border-l border-slate-200/40 bg-surface">
                  {p.status === 'Em estoque' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>{p.status}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-500/15 text-red-400 border border-red-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>{p.status}
                    </span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-slate-200/40 bg-surface-dark font-semibold text-sm text-slate-600 sticky left-0 z-10">Tags</td>
              {compareList.map(p => (
                <td key={p.id} className="p-4 border-b border-l border-slate-200/40 bg-surface">
                  <div className="flex gap-1.5 flex-wrap">
                    {p.tags?.map((t: string) => (
                      <span key={t} className="px-2 py-0.5 bg-slate-100 text-[10px] text-slate-600 border border-slate-300/50 uppercase tracking-wider rounded-md">{t}</span>
                    )) || <span className="text-slate-600 text-sm">-</span>}
                  </div>
                </td>
              ))}
            </tr>

            {/* Specs */}
            <tr className="bg-surface-dark/60">
              <td colSpan={4} className="p-4 border-b border-slate-200/60 font-condensed text-lg text-brand uppercase sticky left-0 z-10 bg-surface-dark/60">Especificações Técnicas</td>
            </tr>
            {allKeys.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-10 text-center text-slate-600 bg-surface border-b border-slate-200/40">
                  Nenhuma especificação estruturada cadastrada para estes produtos.
                </td>
              </tr>
            ) : (
              allKeys.map((key, idx) => (
                <tr key={key} className={idx % 2 === 0 ? '' : 'bg-surface-dark/20'}>
                  <td className="p-4 border-b border-slate-200/40 bg-surface-dark font-semibold text-sm text-slate-600 sticky left-0 z-10">{KEY_LABELS[key] || key}</td>
                  {compareList.map(p => {
                    const val = p.specs_json && p.specs_json[key];
                    return (
                      <td key={p.id} className="p-4 border-b border-l border-slate-200/40 bg-surface text-sm text-slate-900">
                        {val || <span className="text-slate-700">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
            
            {/* Description */}
            <tr className="bg-surface-dark/60">
              <td colSpan={4} className="p-4 border-b border-slate-200/60 font-condensed text-lg text-brand uppercase sticky left-0 z-10 bg-surface-dark/60">Resumo</td>
            </tr>
            <tr>
              <td className="p-4 border-b border-slate-200/40 bg-surface-dark font-semibold text-sm text-slate-600 sticky left-0 z-10">Descrição</td>
              {compareList.map(p => (
                <td key={p.id} className="p-4 border-b border-l border-slate-200/40 bg-surface text-sm text-slate-600 align-top">
                  {p.specs || <span className="text-slate-700">—</span>}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
