import { Link } from 'react-router-dom';
import { useCompare } from '../context/CompareContext';
import { X, ArrowRight, Zap } from 'lucide-react';
import { getProductThumbImage } from '../utils/image';

export default function FloatingCompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();

  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl">
      <div className="glass rounded-2xl shadow-2xl shadow-black/40 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-white font-condensed text-lg whitespace-nowrap">
              Comparar <span className="text-brand">({compareList.length}/3)</span>
            </span>
            <div className="flex gap-2">
              {compareList.map((p) => {
                const thumbImg = getProductThumbImage(p);
                return (
                <div key={p.id} className="relative w-11 h-11 rounded-lg border border-slate-700/50 group bg-surface-dark overflow-hidden">
                  {thumbImg ? (
                    <img src={thumbImg} className="w-full h-full object-contain p-1" alt={p.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Zap size={14} className="text-slate-600" /></div>
                  )}
                  <button 
                    onClick={() => removeFromCompare(p.id)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X size={10} />
                  </button>
                </div>
              );})}
              {Array.from({ length: 3 - compareList.length }).map((_, i) => (
                <div key={`empty-${i}`} className="w-11 h-11 rounded-lg border border-dashed border-slate-700/50 flex items-center justify-center bg-surface-dark/30">
                  <span className="text-slate-700 font-bold text-sm">+</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={clearCompare} className="text-slate-500 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors">
              Limpar
            </button>
            
            <Link 
              to="/comparar" 
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-sm transition-all ${compareList.length >= 2 ? 'bg-brand text-white hover:bg-brand-dark hover:shadow-lg hover:shadow-brand/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              onClick={(e) => {
                if (compareList.length < 2) {
                  e.preventDefault();
                }
              }}
            >
              Comparar <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
