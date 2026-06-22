import { useState, useEffect, useRef } from 'react';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, UploadCloud, X, Plus, GripVertical, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { getThumbUrl } from '../../../utils/image';

interface Category { id: number; name: string; }
interface Tag { id: number; name: string; }

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [productType, setProductType] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('Em estoque');
  const [stockCount, setStockCount] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  
  const [specs, setSpecs] = useState<{key: string, value: string}[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);

  // Network specific fields
  const [netWifi, setNetWifi] = useState('');
  const [netFreq, setNetFreq] = useState('');
  const [netPorts, setNetPorts] = useState('');
  const [netSpeed, setNetSpeed] = useState('');
  const [netPower, setNetPower] = useState('');
  const [netMgmt, setNetMgmt] = useState('');
  const [netAntennas, setNetAntennas] = useState('');

  const fixedCategories = ['Residencial', 'Empresarial', 'FTTH', 'Datacenter'];

  const [tagsList, setTagsList] = useState<Tag[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tagRes] = await Promise.all([
          api.get('/tags')
        ]);
        setTagsList(await tagRes.json() || []);

        if (isEditing) {
          const prodRes = await api.get(`/products?q=&limit=1000`);
          const prodData = await prodRes.json();
          const p = (prodData.data || []).find((item: any) => item.id.toString() === id);
          
          if (p) {
            setName(p.name);
            setBrand(p.brand);
            setCategory(p.category);
            setStatus(p.status);
            setDescription(p.specs || ''); // Old specs text field
            setSelectedTags(p.tags || []);
            setImages(p.images_json || (p.image_url ? [p.image_url] : []));
            
            if (p.specs_json) {
              setProductType(p.specs_json['_type'] || '');
              setStockCount(p.specs_json['_stock_count'] || '');
              setPrice(p.specs_json['_price'] || '');
              setNetWifi(p.specs_json['_net_wifi'] || '');
              setNetFreq(p.specs_json['_net_freq'] || '');
              setNetPorts(p.specs_json['_net_ports'] || '');
              setNetSpeed(p.specs_json['_net_speed'] || '');
              setNetPower(p.specs_json['_net_power'] || '');
              setNetMgmt(p.specs_json['_net_mgmt'] || '');
              setNetAntennas(p.specs_json['_net_antennas'] || '');

              const specArray = Object.entries(p.specs_json)
                .filter(([k]) => !k.startsWith('_net_'))
                .map(([k, v]) => ({ key: k, value: v as string }));
              setSpecs(specArray);
            }
          } else {
            toast.error("Produto não encontrado");
            navigate('/gestor-nlf-admin/produtos');
          }
        }
      } catch (e) {
        toast.error("Erro ao carregar formulário");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEditing]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // Simulate multiple uploads
    const newImages = [...images];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      
      const formData = new FormData();
      formData.append('image', file);
      
      const loadToast = toast;
      try {
        const res = await api.post('/upload', formData);
        if (!res.ok) throw new Error();
        const data = await res.json();
        newImages.push(data.url);
      } catch (e) {
        toast.error(`Falha ao enviar imagem ${file.name}`);
      }
    }
    
    setImages(newImages);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === images.length - 1) return;
    
    const newImages = [...images];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    
    const temp = newImages[targetIndex];
    newImages[targetIndex] = newImages[index];
    newImages[index] = temp;
    
    setImages(newImages);
  };

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(prev => prev.filter(t => t !== tagName));
    } else {
      setSelectedTags(prev => [...prev, tagName]);
    }
  };

  const handleCreateTag = async (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    if (e) e.preventDefault();
    
    const val = newTagInput.trim();
    if (!val) return;

    try {
      const res = await api.post('/tags', { name: val });
      if (!res.ok) {
        if (res.status === 409) {
          toast.error('Tag já existe!');
        } else {
          throw new Error('Falha ao criar tag');
        }
        return;
      }
      const newTag = await res.json();
      setTagsList(prev => [...prev, newTag]);
      setSelectedTags(prev => [...prev, newTag.name]);
      setNewTagInput('');
      toast.success('Tag criada e adicionada ao produto!');
    } catch (err) {
      toast.error('Erro ao criar tag');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category) {
      toast.error('Nome e Categoria são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const specsMap = specs.reduce((acc, curr) => {
        if (curr.key.trim() && curr.value.trim()) {
          acc[curr.key.trim()] = curr.value.trim();
        }
        return acc;
      }, {} as Record<string, string>);

      if (netWifi) specsMap['_net_wifi'] = netWifi;
      if (netFreq) specsMap['_net_freq'] = netFreq;
      if (netPorts) specsMap['_net_ports'] = netPorts;
      if (netSpeed) specsMap['_net_speed'] = netSpeed;
      if (netPower) specsMap['_net_power'] = netPower;
      if (netMgmt) specsMap['_net_mgmt'] = netMgmt;
      if (netAntennas) specsMap['_net_antennas'] = netAntennas;
      if (stockCount && status === 'Em estoque') specsMap['_stock_count'] = stockCount;
      if (productType.trim()) specsMap['_type'] = productType.trim();
      if (price.trim()) specsMap['_price'] = price.trim();

      const payload = {
        name,
        brand,
        category,
        status,
        specs: description,
        tags: selectedTags,
        images_json: images,
        image_url: images.length > 0 ? images[0] : '', // Cover fallback
        specs_json: specsMap
      };

      const res = isEditing 
        ? await api.put(`/products/${id}`, payload)
        : await api.post(`/products`, payload);

      if (!res.ok) throw new Error();

      toast.success(`Produto ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      navigate('/gestor-nlf-admin/produtos');
    } catch (e) {
      toast.error('Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-slate-400 p-8">Carregando formulário...</div>;

  return (
    <div className="w-full max-w-7xl mx-auto pb-16">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/gestor-nlf-admin/produtos')}
          className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-slate-100">
          {isEditing ? 'Editar Produto' : 'Novo Produto'}
        </h2>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Main Info) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-medium text-slate-200 mb-2">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome do Produto *</label>
                <input 
                  type="text" required
                  value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Marca</label>
                <input 
                  type="text" placeholder="Ex: Huawei, Cisco"
                  value={brand} onChange={e => setBrand(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Tipo de Equipamento</label>
                <input 
                  type="text" placeholder="Ex: OLT, Switch, Roteador"
                  value={productType} onChange={e => setProductType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Valor (Opcional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-medium">R$</span>
                  <input 
                    type="text" placeholder="0,00"
                    value={price} onChange={e => setPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Descrição Curta</label>
              <textarea 
                rows={3}
                value={description} onChange={e => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand resize-none"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-medium text-slate-200 mb-4">Galeria de Imagens</h3>
            
            {/* Image Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                {images.map((img, idx) => (
                  <div key={idx} className={`relative group bg-slate-950 border rounded-lg aspect-square overflow-hidden flex flex-col ${idx === 0 ? 'border-brand' : 'border-slate-800'}`}>
                    <img src={getThumbUrl(img)} className="w-full h-full object-contain p-2" />
                    {idx === 0 && (
                      <div className="absolute top-2 left-2 bg-brand text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow">
                        Capa
                      </div>
                    )}
                    <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 bg-red-500/90 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                    
                    <div className="absolute bottom-0 left-0 w-full bg-slate-900/90 backdrop-blur border-t border-slate-800 flex justify-between p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => moveImage(idx, 'left')} disabled={idx === 0} className="p-1 text-slate-400 hover:text-white disabled:opacity-30">
                        <ChevronLeft size={16} />
                      </button>
                      <button type="button" onClick={() => moveImage(idx, 'right')} disabled={idx === images.length - 1} className="p-1 text-slate-400 hover:text-white disabled:opacity-30">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Drag & Drop Area */}
            <div 
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${isDragging ? 'border-brand bg-brand/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleUpload(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={32} className="text-slate-500 mb-3" />
              <p className="text-slate-300 font-medium mb-1">Clique ou arraste as imagens aqui</p>
              <p className="text-slate-500 text-sm">A primeira imagem será a capa do produto</p>
              <input 
                type="file" multiple accept="image/*" className="hidden" 
                ref={fileInputRef}
                onChange={(e) => handleUpload(e.target.files)}
              />
            </div>
          </div>

          {/* Network Specs */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-medium text-slate-200 mb-4">Especificações de Rede</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Padrão Wi-Fi</label>
                <select 
                  value={netWifi} onChange={e => setNetWifi(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand"
                >
                  <option value="">Não aplicável</option>
                  <option value="Wi-Fi 4">Wi-Fi 4</option>
                  <option value="Wi-Fi 5">Wi-Fi 5</option>
                  <option value="Wi-Fi 6">Wi-Fi 6</option>
                  <option value="Wi-Fi 6E">Wi-Fi 6E</option>
                  <option value="Wi-Fi 7">Wi-Fi 7</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Frequência</label>
                <select 
                  value={netFreq} onChange={e => setNetFreq(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand"
                >
                  <option value="">Não aplicável</option>
                  <option value="2.4 GHz">2.4 GHz</option>
                  <option value="5 GHz">5 GHz</option>
                  <option value="Dual-Band">Dual-Band</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Interfaces / Portas</label>
                <input 
                  type="text" placeholder="Ex: 4x LAN Gigabit, 1x WAN"
                  value={netPorts} onChange={e => setNetPorts(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Taxa de Transmissão (Throughput)</label>
                <input 
                  type="text" placeholder="Ex: Até 1200 Mbps"
                  value={netSpeed} onChange={e => setNetSpeed(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Alimentação e PoE</label>
                <input 
                  type="text" placeholder="Ex: 12V DC, PoE Passivo"
                  value={netPower} onChange={e => setNetPower(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Gerenciamento</label>
                <select 
                  value={netMgmt} onChange={e => setNetMgmt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand"
                >
                  <option value="">Não aplicável</option>
                  <option value="Não gerenciável">Não gerenciável</option>
                  <option value="Web UI">Web UI</option>
                  <option value="Cloud">Cloud</option>
                  <option value="CLI">CLI</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-1">Antenas</label>
                <input 
                  type="text" placeholder="Ex: 4 Antenas Externas de 5dBi"
                  value={netAntennas} onChange={e => setNetAntennas(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Specs */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-slate-200">Ficha Técnica</h3>
              <button type="button" onClick={() => setSpecs([...specs, {key: '', value: ''}])} className="text-brand text-sm font-medium hover:underline flex items-center gap-1">
                <Plus size={16} /> Adicionar Linha
              </button>
            </div>
            
            {specs.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4 border border-dashed border-slate-800 rounded-lg">Nenhuma especificação técnica definida.</p>
            ) : (
              <div className="space-y-3">
                {specs.map((spec, i) => (
                  <div key={i} className="flex gap-2">
                    <input 
                      type="text" placeholder="Ex: Portas Gigabit" value={spec.key}
                      onChange={(e) => {
                        const newSpecs = [...specs];
                        newSpecs[i].key = e.target.value;
                        setSpecs(newSpecs);
                      }}
                      className="w-1/3 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand"
                    />
                    <input 
                      type="text" placeholder="Ex: 4 portas" value={spec.value}
                      onChange={(e) => {
                        const newSpecs = [...specs];
                        newSpecs[i].value = e.target.value;
                        setSpecs(newSpecs);
                      }}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand"
                    />
                    <button type="button" onClick={() => setSpecs(specs.filter((_, idx) => idx !== i))} className="p-2 text-slate-500 hover:text-red-400 bg-slate-950 border border-slate-800 hover:border-red-500/50 rounded-lg transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Meta & Actions) */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-medium text-slate-200 mb-2">Organização</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Status *</label>
              <select 
                value={status} onChange={e => setStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand"
              >
                <option value="Em estoque">Em estoque</option>
                <option value="Em falta">Em falta</option>
              </select>
            </div>

            {status === 'Em estoque' && (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Quantidade em Estoque</label>
                <input 
                  type="number" min="0" placeholder="Ex: 5"
                  value={stockCount} onChange={e => setStockCount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Categoria *</label>
              <select 
                required
                value={category} onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand"
              >
                <option value="">Selecione uma categoria...</option>
                {fixedCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 mt-4">Tags do Produto</label>
              
              <div className="flex gap-2 mb-3">
                <input 
                  type="text" 
                  placeholder="Nova tag..." 
                  value={newTagInput}
                  onChange={e => setNewTagInput(e.target.value)}
                  onKeyDown={handleCreateTag}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-brand"
                />
                <button 
                  type="button"
                  onClick={handleCreateTag}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-slate-700"
                >
                  Criar
                </button>
              </div>

              {tagsList.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhuma tag criada ainda. Digite acima para criar.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tagsList.map(t => {
                    const isActive = selectedTags.includes(t.name);
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => toggleTag(t.name)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                          isActive 
                            ? 'bg-brand/20 text-brand border-brand/50' 
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <button 
            type="submit"
            disabled={saving}
            className="w-full bg-brand text-white px-6 py-4 rounded-xl font-bold hover:bg-brand-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-brand/20"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : <Save size={20} />}
            {saving ? 'Salvando...' : 'Salvar Produto'}
          </button>
        </div>
      </form>
    </div>
  );
}
