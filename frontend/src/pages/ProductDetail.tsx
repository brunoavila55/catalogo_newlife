import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, ChevronLeft, ChevronRight, PlusCircle, CheckCircle2, Zap, ExternalLink, Wifi, Activity, Plug, Settings, Radio, Network, FolderPlus } from 'lucide-react';
import { api, BASE_URL } from '../services/api';
import { useCompare } from '../context/CompareContext';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import { getImageUrl } from '../utils/image';

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  
  const { compareList, addToCompare, removeFromCompare } = useCompare();
  const { addItem } = useProject();
  const toast = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
          
          // Buscar produtos relacionados (mesma categoria)
          try {
            const relRes = await api.get(`/products?q=&limit=50`);
            if (relRes.ok) {
              const relData = await relRes.json();
              const filtered = (relData.data || [])
                .filter((p: any) => p.category === data.category && p.id !== data.id)
                .slice(0, 4);
              setRelatedProducts(filtered);
            }
          } catch (e) {
            console.error("Erro ao buscar relacionados", e);
          }
        } else {
          setProduct(null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-6 pt-24 pb-16 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin w-10 h-10 border-3 border-brand border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-6 pt-24 pb-16 font-sans">
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
            <Zap size={28} className="text-slate-600" />
          </div>
          <h1 className="text-2xl text-white mb-3">Produto não encontrado</h1>
          <p className="text-slate-500 mb-6">O equipamento que você procura não existe ou foi removido.</p>
          <Link to="/catalogo" className="text-brand hover:text-brand-light flex items-center gap-2 font-semibold transition-colors">
            <ArrowLeft size={16} /> Voltar ao catálogo
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images_json && product.images_json.length > 0 ? product.images_json : [];
  const specsMap = product.specs_json || {};
  
  const netSpecs = {
    wifi: specsMap['_net_wifi'] || '',
    freq: specsMap['_net_freq'] || '',
    ports: specsMap['_net_ports'] || '',
    speed: specsMap['_net_speed'] || '',
    power: specsMap['_net_power'] || '',
    mgmt: specsMap['_net_mgmt'] || '',
    antennas: specsMap['_net_antennas'] || ''
  };
  const hasNetSpecs = Object.values(netSpecs).some(v => v);
  
  const genericSpecs = Object.entries(specsMap).filter(([k]) => !k.startsWith('_'));
  const hasGenericSpecs = genericSpecs.length > 0;
  const isInCompare = compareList.find(c => c.id === product.id);

  const imagesUrls = images.map((img: string) => getImageUrl(img)).filter(Boolean);

  const nextImage = () => setActiveImage((prev) => (prev + 1) % imagesUrls.length);
  const prevImage = () => setActiveImage((prev) => (prev === 0 ? imagesUrls.length - 1 : prev - 1));

  return (
    <div className="container mx-auto px-6 pt-24 pb-16 font-sans">
      {/* Breadcrumb */}
      <Link to="/catalogo" className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-8 transition-colors text-sm font-medium">
        <ArrowLeft size={16} /> Voltar ao catálogo
      </Link>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Image Gallery */}
        <div className="w-full lg:w-1/2">
          <div className="aspect-square bg-surface rounded-2xl border border-slate-800/60 relative flex items-center justify-center overflow-hidden mb-4 group">
            {imagesUrls.length > 0 ? (
              <>
                <img 
                  src={imagesUrls[activeImage]} 
                  alt={product.name} 
                  className="w-full h-full object-contain p-8 transition-transform duration-500"
                />
                {imagesUrls.length > 1 && (
                  <>
                    <button 
                      onClick={prevImage}
                      className="absolute left-3 p-2.5 rounded-xl bg-surface-dark/80 backdrop-blur-sm text-white border border-slate-800/60 hover:bg-brand hover:border-brand transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button 
                      onClick={nextImage}
                      className="absolute right-3 p-2.5 rounded-xl bg-surface-dark/80 backdrop-blur-sm text-white border border-slate-800/60 hover:bg-brand hover:border-brand transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}

                {/* Image counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-surface-dark/80 backdrop-blur-sm text-xs text-slate-400 font-medium border border-slate-800/60">
                    {activeImage + 1} / {imagesUrls.length}
                  </div>
                )}
              </>
            ) : product.image_url ? (
              <img src={getImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-contain p-8 transition-transform duration-500" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-600">
                <Zap size={40} />
                <span className="text-sm">Sem imagem disponível</span>
              </div>
            )}
          </div>
          
          {/* Thumbnails */}
          {imagesUrls.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {imagesUrls.map((img: string, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-brand shadow-lg shadow-brand/10' : 'border-slate-800 hover:border-slate-600'}`}
                >
                  <img src={img} className="w-full h-full object-contain p-1" alt="Thumbnail" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="w-full lg:w-1/2">
          <span className="text-brand font-bold uppercase tracking-[0.2em] text-sm mb-3 block">{product.category}</span>
          <h1 className="text-4xl md:text-5xl text-white font-condensed mb-2">{product.name}</h1>
          <p className="text-lg text-slate-500 mb-6">{product.brand}</p>
          
          {/* Status & Price */}
          <div className="mb-6 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              {product.status === 'Em estoque' ? (
                <span className="text-sm font-medium text-emerald-400/90 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Em estoque {specsMap['_stock_count'] ? `(${specsMap['_stock_count']} unidades)` : ''}
                </span>
              ) : (
                <span className="text-sm font-medium text-red-400/90 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  Em falta
                </span>
              )}
            </div>
            
            {specsMap['_price'] && (
              <div className="text-2xl font-bold text-white">
                <span className="text-sm font-medium text-slate-400 mr-1">R$</span>
                {specsMap['_price']}
              </div>
            )}
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-8">
              {product.tags.map((t: string) => (
                <span key={t} className="px-3 py-1.5 bg-slate-800/60 border border-slate-700/50 text-slate-300 text-xs uppercase tracking-wider rounded-lg font-medium">
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mb-12 flex-wrap">

            <button 
              onClick={() => {
                if (isInCompare) removeFromCompare(product.id);
                else addToCompare(product);
              }}
              className={`flex items-center gap-2 border px-6 py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm transition-all ${isInCompare ? 'bg-brand/10 border-brand text-brand' : 'bg-transparent border-slate-700 text-slate-300 hover:border-brand hover:text-brand'}`}
            >
              {isInCompare ? (
                <><CheckCircle2 size={18} /> No Comparativo</>
              ) : (
                <><PlusCircle size={18} /> Comparar</>
              )}
            </button>

            <button
              onClick={() => {
                addItem(product, 1);
                toast.success('Equipamento adicionado ao Projeto!');
              }}
              className="flex items-center gap-2 border border-slate-700 bg-transparent text-slate-300 hover:border-emerald-400 hover:text-emerald-400 px-6 py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm transition-all"
            >
              <FolderPlus size={18} /> Adicionar ao Projeto
            </button>
          </div>

          {/* Network Specs Highlights */}
          {hasNetSpecs && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              {netSpecs.wifi && (
                <div className="bg-surface border border-slate-800/60 rounded-xl p-4 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                    <Wifi size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Wi-Fi</span>
                    <span className="text-sm text-slate-200 font-semibold">{netSpecs.wifi}</span>
                  </div>
                </div>
              )}
              {netSpecs.freq && (
                <div className="bg-surface border border-slate-800/60 rounded-xl p-4 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Activity size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Freq / Largura de Banda</span>
                    <span className="text-sm text-slate-200 font-semibold">{netSpecs.freq}</span>
                  </div>
                </div>
              )}
              {netSpecs.ports && (
                <div className="bg-surface border border-slate-800/60 rounded-xl p-4 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Network size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Portas Disponíveis</span>
                    <span className="text-sm text-slate-200 font-semibold">{netSpecs.ports}</span>
                  </div>
                </div>
              )}
              {netSpecs.speed && (
                <div className="bg-surface border border-slate-800/60 rounded-xl p-4 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <Zap size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Classe / Velocidade</span>
                    <span className="text-sm text-slate-200 font-semibold">{netSpecs.speed}</span>
                  </div>
                </div>
              )}
              {netSpecs.power && (
                <div className="bg-surface border border-slate-800/60 rounded-xl p-4 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Plug size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Alimentação</span>
                    <span className="text-sm text-slate-200 font-semibold">{netSpecs.power}</span>
                  </div>
                </div>
              )}
              {netSpecs.mgmt && (
                <div className="bg-surface border border-slate-800/60 rounded-xl p-4 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Settings size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Gerenciamento</span>
                    <span className="text-sm text-slate-200 font-semibold">{netSpecs.mgmt}</span>
                  </div>
                </div>
              )}
              {netSpecs.antennas && (
                <div className="bg-surface border border-slate-800/60 rounded-xl p-4 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                    <Radio size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Antenas</span>
                    <span className="text-sm text-slate-200 font-semibold">{netSpecs.antennas}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Specs */}
          {hasGenericSpecs && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl text-white font-condensed mb-5">Especificações Técnicas</h2>
              
              <div className="space-y-0 divide-y divide-slate-800/50">
                {genericSpecs.map(([key, value]) => (
                  <div key={key} className="flex flex-col sm:flex-row py-3.5 gap-1">
                    <span className="w-full sm:w-2/5 text-slate-500 text-sm font-semibold">{key}</span>
                    <span className="w-full sm:w-3/5 text-white text-sm">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description has been moved below */}
        </div>
      </div>

      {/* Description */}
      {product.specs && (
        <div className="mt-12 bg-surface-dark border border-slate-800/60 rounded-2xl p-8 shadow-xl shadow-black/20">
          <h2 className="text-2xl text-white font-condensed mb-6">Descrição do Equipamento</h2>
          <div className="prose prose-invert max-w-none text-base leading-relaxed">
            {product.specs.split('\n').map((line: string, i: number) => (
              <p key={i} className={line.trim() === '' ? 'h-4' : 'mb-4 text-slate-300 text-[15px]'}>{line}</p>
            ))}
          </div>
        </div>
      )}
      
      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-20 pt-10 border-t border-slate-800/60">
          <h2 className="text-2xl font-bold text-white mb-8">Produtos Relacionados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedProducts.map(p => {
              const isInCompare = compareList.find(c => c.id === p.id);
              return (
                <div key={p.id} className="group relative rounded-2xl overflow-hidden bg-surface border border-slate-800/60 hover:border-brand/40 transition-all duration-500 cursor-pointer" onClick={() => window.location.href = `/produto/${p.slug}`}>
                  <div className="aspect-[4/3] bg-surface-dark relative overflow-hidden flex items-center justify-center p-4">
                    {p.image_url ? (
                      <img src={getImageUrl(p.image_url)} alt={p.name} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <Zap size={32} className="text-slate-700" />
                    )}
                    
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
                  </div>
                  <div className="p-4">
                    <span className="text-[10px] text-brand font-bold uppercase tracking-[0.15em] block mb-1">{p.category}</span>
                    <h3 className="text-sm text-white font-condensed group-hover:text-brand transition-colors duration-300 line-clamp-1">{p.name}</h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
