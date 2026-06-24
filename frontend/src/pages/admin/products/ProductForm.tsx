import { useState, useEffect, useRef } from 'react';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, UploadCloud, X, Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
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
  const [purchaseUrl, setPurchaseUrl] = useState('');
  
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


  // Transceiver SFP specific fields
  const [sfpForm, setSfpForm] = useState('');
  const [sfpRate, setSfpRate] = useState('');
  const [sfpWave, setSfpWave] = useState('');
  const [sfpDist, setSfpDist] = useState('');
  const [sfpConn, setSfpConn] = useState('');
  const [sfpMode, setSfpMode] = useState('');


  // OLT PON Module specific fields
  const [ponTech, setPonTech] = useState('');
  const [ponClass, setPonClass] = useState('');
  const [ponTxPower, setPonTxPower] = useState('');
  const [ponRxSens, setPonRxSens] = useState('');
  const [ponWave, setPonWave] = useState('');


  // FTTH Passive / Splitter fields
  const [ftthType, setFtthType] = useState('');
  const [ftthSplit, setFtthSplit] = useState('');
  const [ftthConn, setFtthConn] = useState('');
  const [ftthFiber, setFtthFiber] = useState('');
  const [ftthLoss, setFtthLoss] = useState('');


  // Use cases (Pros/Cons)
  const [useCasesPro, setUseCasesPro] = useState('');
  const [useCasesCon, setUseCasesCon] = useState('');

  const [categoriesList, setCategoriesList] = useState<Category[]>([]);

  const [tagsList, setTagsList] = useState<Tag[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const cloneData = location.state?.cloneData;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tagRes, catRes] = await Promise.all([
          api.get('/tags'),
          api.get('/categories')
        ]);
        setTagsList(await tagRes.json() || []);
        setCategoriesList(await catRes.json() || []);

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
            setPurchaseUrl(p.purchase_url || '');
            
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

            setSfpForm(p.specs_json['_sfp_form'] || '');
            setSfpRate(p.specs_json['_sfp_rate'] || '');
            setSfpWave(p.specs_json['_sfp_wave'] || '');
            setSfpDist(p.specs_json['_sfp_dist'] || '');
            setSfpConn(p.specs_json['_sfp_conn'] || '');
            setSfpMode(p.specs_json['_sfp_mode'] || '');

            setPonTech(p.specs_json['_pon_tech'] || '');
            setPonClass(p.specs_json['_pon_class'] || '');
            setPonTxPower(p.specs_json['_pon_txpower'] || '');
            setPonRxSens(p.specs_json['_pon_rxsens'] || '');
            setPonWave(p.specs_json['_pon_wave'] || '');

            setFtthType(p.specs_json['_ftth_type'] || '');
            setFtthSplit(p.specs_json['_ftth_split'] || '');
            setFtthConn(p.specs_json['_ftth_conn'] || '');
            setFtthFiber(p.specs_json['_ftth_fiber'] || '');
            setFtthLoss(p.specs_json['_ftth_loss'] || '');

            
            setUseCasesPro(Array(5).fill('').map((_, i) => (p.specs_json['_use_cases_pro'] || '').split('\n')[i] || ''));

            
            setUseCasesCon(Array(5).fill('').map((_, i) => (p.specs_json['_use_cases_con'] || '').split('\n')[i] || ''));

              
              setSfpForm(p.specs_json['_sfp_form'] || '');
              setSfpRate(p.specs_json['_sfp_rate'] || '');
              setSfpWave(p.specs_json['_sfp_wave'] || '');
              setSfpDist(p.specs_json['_sfp_dist'] || '');
              setSfpConn(p.specs_json['_sfp_conn'] || '');

              setSfpMode(p.specs_json['_sfp_mode'] || '');

            setPonTech(p.specs_json['_pon_tech'] || '');
            setPonClass(p.specs_json['_pon_class'] || '');
            setPonTxPower(p.specs_json['_pon_txpower'] || '');
            setPonRxSens(p.specs_json['_pon_rxsens'] || '');
            setPonWave(p.specs_json['_pon_wave'] || '');

            setFtthType(p.specs_json['_ftth_type'] || '');
            setFtthSplit(p.specs_json['_ftth_split'] || '');
            setFtthConn(p.specs_json['_ftth_conn'] || '');
            setFtthFiber(p.specs_json['_ftth_fiber'] || '');
            setFtthLoss(p.specs_json['_ftth_loss'] || '');

            
            setUseCasesPro(Array(5).fill('').map((_, i) => (p.specs_json['_use_cases_pro'] || '').split('\n')[i] || ''));

            
            setUseCasesCon(Array(5).fill('').map((_, i) => (p.specs_json['_use_cases_con'] || '').split('\n')[i] || ''));


              setPonTech(p.specs_json['_pon_tech'] || '');
              setPonClass(p.specs_json['_pon_class'] || '');
              setPonTxPower(p.specs_json['_pon_txpower'] || '');
              setPonRxSens(p.specs_json['_pon_rxsens'] || '');
              setPonWave(p.specs_json['_pon_wave'] || '');

            setFtthType(p.specs_json['_ftth_type'] || '');
            setFtthSplit(p.specs_json['_ftth_split'] || '');
            setFtthConn(p.specs_json['_ftth_conn'] || '');
            setFtthFiber(p.specs_json['_ftth_fiber'] || '');
            setFtthLoss(p.specs_json['_ftth_loss'] || '');

            
            setUseCasesPro(Array(5).fill('').map((_, i) => (p.specs_json['_use_cases_pro'] || '').split('\n')[i] || ''));

            
            setUseCasesCon(Array(5).fill('').map((_, i) => (p.specs_json['_use_cases_con'] || '').split('\n')[i] || ''));




              const specArray = Object.entries(p.specs_json)
                .filter(([k]) => !k.startsWith('_net_') && !k.startsWith('_sfp_') && !k.startsWith('_pon_') && !k.startsWith('_ftth_'))
                .map(([k, v]) => ({ key: k, value: v as string }));
              setSpecs(specArray);
            }
          } else {
            toast.error("Produto não encontrado");
            navigate('/gestor-nlf-admin/produtos');
          }
        } else if (cloneData) {
          const p = cloneData;
          setName(`Cópia de ${p.name}`);
          setBrand(p.brand);
          setCategory(p.category);
          setStatus(p.status);
          setDescription(p.specs || ''); // Old specs text field
          setSelectedTags(p.tags || []);
          setImages(p.images_json || (p.image_url ? [p.image_url] : []));
          setPurchaseUrl(p.purchase_url || '');
          
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

            setSfpForm(p.specs_json['_sfp_form'] || '');
            setSfpRate(p.specs_json['_sfp_rate'] || '');
            setSfpWave(p.specs_json['_sfp_wave'] || '');
            setSfpDist(p.specs_json['_sfp_dist'] || '');
            setSfpConn(p.specs_json['_sfp_conn'] || '');
            setSfpMode(p.specs_json['_sfp_mode'] || '');

            setPonTech(p.specs_json['_pon_tech'] || '');
            setPonClass(p.specs_json['_pon_class'] || '');
            setPonTxPower(p.specs_json['_pon_txpower'] || '');
            setPonRxSens(p.specs_json['_pon_rxsens'] || '');
            setPonWave(p.specs_json['_pon_wave'] || '');

            setFtthType(p.specs_json['_ftth_type'] || '');
            setFtthSplit(p.specs_json['_ftth_split'] || '');
            setFtthConn(p.specs_json['_ftth_conn'] || '');
            setFtthFiber(p.specs_json['_ftth_fiber'] || '');
            setFtthLoss(p.specs_json['_ftth_loss'] || '');

            
            setUseCasesPro(Array(5).fill('').map((_, i) => (p.specs_json['_use_cases_pro'] || '').split('\n')[i] || ''));

            
            setUseCasesCon(Array(5).fill('').map((_, i) => (p.specs_json['_use_cases_con'] || '').split('\n')[i] || ''));


            const specArray = Object.entries(p.specs_json)
              .filter(([k]) => !k.startsWith('_net_') && !k.startsWith('_sfp_') && !k.startsWith('_pon_') && !k.startsWith('_ftth_') && !k.startsWith('_'))
              .map(([k, v]) => ({ key: k, value: v as string }));
            setSpecs(specArray);
          }
          setLoading(false);
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
      
      if (sfpForm) specsMap['_sfp_form'] = sfpForm;
      if (sfpRate) specsMap['_sfp_rate'] = sfpRate;
      if (sfpWave) specsMap['_sfp_wave'] = sfpWave;
      if (sfpDist) specsMap['_sfp_dist'] = sfpDist;
      if (sfpConn) specsMap['_sfp_conn'] = sfpConn;
      if (sfpMode) specsMap['_sfp_mode'] = sfpMode;

      if (ponTech) specsMap['_pon_tech'] = ponTech;
      if (ponClass) specsMap['_pon_class'] = ponClass;
      if (ponTxPower) specsMap['_pon_txpower'] = ponTxPower;
      if (ponRxSens) specsMap['_pon_rxsens'] = ponRxSens;
      if (ponWave) specsMap['_pon_wave'] = ponWave;

      if (ftthType) specsMap['_ftth_type'] = ftthType;
      if (ftthSplit) specsMap['_ftth_split'] = ftthSplit;
      if (ftthConn) specsMap['_ftth_conn'] = ftthConn;
      if (ftthFiber) specsMap['_ftth_fiber'] = ftthFiber;
      if (ftthLoss) specsMap['_ftth_loss'] = ftthLoss;

      if (useCasesPro.trim()) specsMap['_use_cases_pro'] = useCasesPro.trim();
      if (useCasesCon.trim()) specsMap['_use_cases_con'] = useCasesCon.trim();
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
        specs_json: specsMap,
        purchase_url: purchaseUrl.trim()
      };

      const res = isEditing 
        ? await api.put(`/products/${id}`, payload)
        : await api.post(`/products`, payload);

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Erro HTTP ${res.status}`);
      }

      toast.success(`Produto ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      navigate('/gestor-nlf-admin/produtos');
    } catch (e: any) {
      toast.error(`Erro ao salvar produto: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-slate-600 p-8">Carregando formulário...</div>;

  return (
    <div className="w-full max-w-7xl mx-auto pb-16">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/gestor-nlf-admin/produtos')}
          className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-white rounded-lg transition-colors border border-slate-200"
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
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Link de Compra (URL)</label>
                <input 
                  type="url" 
                  value={purchaseUrl} onChange={e => setPurchaseUrl(e.target.value)}
                  placeholder="https://www.mercadolivre.com.br/..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Nome do Produto *</label>
                <input 
                  type="text" required
                  value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Marca</label>
                <input 
                  type="text" placeholder="Ex: Huawei, Cisco"
                  value={brand} onChange={e => setBrand(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Tipo de Equipamento</label>
                <input 
                  type="text" placeholder="Ex: OLT, Switch, Roteador"
                  value={productType} onChange={e => setProductType(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Valor (Opcional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-600 font-medium">R$</span>
                  <input 
                    type="text" placeholder="0,00"
                    value={price} onChange={e => setPrice(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Descrição Curta</label>
              <textarea 
                rows={3}
                value={description} onChange={e => setDescription(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand resize-none"
              />
            </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">✅ Quando Usar (Recomendações)</label>
                <div className="space-y-2">
                  {useCasesPro.map((item, i) => (
                    <input 
                      key={`pro-${i}`}
                      type="text"
                      placeholder={`Motivo ${i + 1}`}
                      value={item}
                      onChange={e => {
                        const newPro = [...useCasesPro];
                        newPro[i] = e.target.value;
                        setUseCasesPro(newPro);
                      }}
                      className="w-full bg-white border border-emerald-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 placeholder:text-slate-300"
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">❌ Quando NÃO Usar (Limitações)</label>
                <div className="space-y-2">
                  {useCasesCon.map((item, i) => (
                    <input 
                      key={`con-${i}`}
                      type="text"
                      placeholder={`Motivo ${i + 1}`}
                      value={item}
                      onChange={e => {
                        const newCon = [...useCasesCon];
                        newCon[i] = e.target.value;
                        setUseCasesCon(newCon);
                      }}
                      className="w-full bg-white border border-rose-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-rose-500 placeholder:text-slate-300"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Galeria de Imagens</h3>
            
            {/* Image Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                {images.map((img, idx) => (
                  <div key={idx} className={`relative group bg-white border rounded-lg aspect-square overflow-hidden flex flex-col ${idx === 0 ? 'border-brand' : 'border-slate-200'}`}>
                    <img src={getThumbUrl(img)} className="w-full h-full object-contain p-2" />
                    {idx === 0 && (
                      <div className="absolute top-2 left-2 bg-brand text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow">
                        Capa
                      </div>
                    )}
                    <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 bg-red-500/90 text-slate-900 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                    
                    <div className="absolute bottom-0 left-0 w-full bg-slate-50/90 backdrop-blur border-t border-slate-200 flex justify-between p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => moveImage(idx, 'left')} disabled={idx === 0} className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30">
                        <ChevronLeft size={16} />
                      </button>
                      <button type="button" onClick={() => moveImage(idx, 'right')} disabled={idx === images.length - 1} className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Drag & Drop Area */}
            <div 
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${isDragging ? 'border-brand bg-brand/5' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleUpload(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={32} className="text-slate-600 mb-3" />
              <p className="text-slate-800 font-medium mb-1">Clique ou arraste as imagens aqui</p>
              <p className="text-slate-600 text-sm">A primeira imagem será a capa do produto</p>
              <input 
                type="file" multiple accept="image/*" className="hidden" 
                ref={fileInputRef}
                onChange={(e) => handleUpload(e.target.files)}
              />
            </div>
          </div>

          {/* Network Specs */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Especificações de Rede</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Padrão Wi-Fi</label>
                <select 
                  value={netWifi} onChange={e => setNetWifi(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
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
                <label className="block text-sm font-medium text-slate-600 mb-1">Frequência / Largura de Banda</label>
                <select 
                  value={netFreq} onChange={e => setNetFreq(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                >
                  <option value="">Não aplicável</option>
                  <option value="20 MHz">20 MHz</option>
                  <option value="40 MHz">40 MHz</option>
                  <option value="80 MHz">80 MHz</option>
                  <option value="160 MHz">160 MHz</option>
                  <option value="320 MHz">320 MHz</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Portas Disponíveis</label>
                <input 
                  type="text" placeholder="Ex: 4x LAN Gigabit, 1x WAN"
                  value={netPorts} onChange={e => setNetPorts(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Classe Wi-Fi / Velocidade</label>
                <input 
                  type="text" placeholder="Ex: AX1800, AX3000, 1200Mbps"
                  value={netSpeed} onChange={e => setNetSpeed(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Alimentação</label>
                <input 
                  type="text" placeholder="Ex: 12V DC, PoE Passivo"
                  value={netPower} onChange={e => setNetPower(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Gerenciamento</label>
                <select 
                  value={netMgmt} onChange={e => setNetMgmt(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                >
                  <option value="">Não aplicável</option>
                  <option value="Não gerenciável">Não gerenciável</option>
                  <option value="Web UI">Web UI</option>
                  <option value="Cloud">Cloud</option>
                  <option value="CLI">CLI</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-1">Antenas</label>
                <input 
                  type="text" placeholder="Ex: 4 Antenas Externas de 5dBi"
                  value={netAntennas} onChange={e => setNetAntennas(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                />
              </div>
            </div>
          </div>


          {/* SFP Transceiver Specs */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Especificações de Transceiver / SFP</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Form Factor</label>
                <select 
                  value={sfpForm} onChange={e => setSfpForm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                >
                  <option value="">Não aplicável</option>
                  <option value="SFP">SFP</option>
                  <option value="SFP+">SFP+</option>
                  <option value="XFP">XFP</option>
                  <option value="QSFP+">QSFP+</option>
                  <option value="QSFP28">QSFP28</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Taxa de Dados (Data Rate)</label>
                <input 
                  type="text" placeholder="Ex: 1.25G, 10G, 40G, 100G"
                  value={sfpRate} onChange={e => setSfpRate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Comprimento de Onda (Wavelength)</label>
                <input 
                  type="text" placeholder="Ex: 850nm, 1310nm, 1550nm, TX1310/RX1550"
                  value={sfpWave} onChange={e => setSfpWave(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Distância Máxima</label>
                <input 
                  type="text" placeholder="Ex: 300m, 3km, 10km, 20km, 80km"
                  value={sfpDist} onChange={e => setSfpDist(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Conector</label>
                <select 
                  value={sfpConn} onChange={e => setSfpConn(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                >
                  <option value="">Não aplicável</option>
                  <option value="LC Duplex">LC Duplex</option>
                  <option value="LC Simplex (BIDI)">LC Simplex (BIDI)</option>
                  <option value="SC">SC</option>
                  <option value="RJ45">RJ45</option>
                  <option value="MPO">MPO</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Modo de Fibra</label>
                <select 
                  value={sfpMode} onChange={e => setSfpMode(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                >
                  <option value="">Não aplicável</option>
                  <option value="Monomodo (SMF)">Monomodo (SMF)</option>
                  <option value="Multimodo (MMF)">Multimodo (MMF)</option>
                  <option value="Cobre (Copper)">Cobre (Copper)</option>
                </select>
              </div>
            </div>
          </div>
          

          {/* OLT PON Module Specs */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Especificações de Módulos OLT (PON)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Tecnologia PON</label>
                <select 
                  value={ponTech} onChange={e => setPonTech(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                >
                  <option value="">Não aplicável</option>
                  <option value="GPON">GPON</option>
                  <option value="EPON">EPON</option>
                  <option value="XG-PON">XG-PON</option>
                  <option value="XGS-PON">XGS-PON</option>
                  <option value="10G-EPON">10G-EPON</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Classe de Potência (Laser)</label>
                <select 
                  value={ponClass} onChange={e => setPonClass(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                >
                  <option value="">Não aplicável</option>
                  <option value="Classe B+">Classe B+</option>
                  <option value="Classe C+">Classe C+</option>
                  <option value="Classe C++">Classe C++</option>
                  <option value="Classe C+++">Classe C+++</option>
                  <option value="PR30">PR30</option>
                  <option value="PX20+">PX20+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Potência de TX (dBm)</label>
                <input 
                  type="text" placeholder="Ex: +3 a +7 dBm"
                  value={ponTxPower} onChange={e => setPonTxPower(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Sensibilidade RX (dBm)</label>
                <input 
                  type="text" placeholder="Ex: -30 dBm"
                  value={ponRxSens} onChange={e => setPonRxSens(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-1">Comprimento de Onda (TX / RX)</label>
                <input 
                  type="text" placeholder="Ex: TX 1490nm / RX 1310nm"
                  value={ponWave} onChange={e => setPonWave(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                />
              </div>
            </div>
          </div>
          

          {/* FTTH Passives Specs */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Especificações FTTH (Passivos/Splitters)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Tipo de Componente</label>
                <select 
                  value={ftthType} onChange={e => setFtthType(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                >
                  <option value="">Não aplicável</option>
                  <option value="Splitter PLC">Splitter PLC</option>
                  <option value="Splitter FBT (Desbalanceado)">Splitter FBT (Desbalanceado)</option>
                  <option value="Conector de Campo (Fast Connector)">Conector de Campo (Fast)</option>
                  <option value="Adaptador Óptico">Adaptador Óptico</option>
                  <option value="Cordão / Pigtail">Cordão / Pigtail</option>
                  <option value="CTO">CTO (Caixa de Terminação)</option>
                  <option value="CEO">CEO (Caixa de Emenda)</option>
                  <option value="PTO">PTO (Ponto de Terminação)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Razão de Divisão (Split Ratio)</label>
                <input 
                  type="text" placeholder="Ex: 1x8, 1x16, 5/95, 10/90"
                  value={ftthSplit} onChange={e => setFtthSplit(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Tipo de Conector</label>
                <select 
                  value={ftthConn} onChange={e => setFtthConn(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                >
                  <option value="">Não aplicável</option>
                  <option value="SC/APC">SC/APC (Verde)</option>
                  <option value="SC/UPC">SC/UPC (Azul)</option>
                  <option value="LC/APC">LC/APC (Verde)</option>
                  <option value="LC/UPC">LC/UPC (Azul)</option>
                  <option value="Sem conector">Sem conector (Desconectorizado)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Tipo de Fibra / Padrão</label>
                <select 
                  value={ftthFiber} onChange={e => setFtthFiber(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                >
                  <option value="">Não aplicável</option>
                  <option value="G.657A1">G.657A1 (BLI)</option>
                  <option value="G.657A2">G.657A2 (BLI)</option>
                  <option value="G.652D">G.652D (Standard)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-1">Atenuação / Perda de Inserção (IL)</label>
                <input 
                  type="text" placeholder="Ex: < 10.5 dB"
                  value={ftthLoss} onChange={e => setFtthLoss(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                />
              </div>
            </div>
          </div>
          
          {/* Dynamic Specs */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-slate-900">Ficha Técnica</h3>
              <button type="button" onClick={() => setSpecs([...specs, {key: '', value: ''}])} className="text-brand text-sm font-medium hover:underline flex items-center gap-1">
                <Plus size={16} /> Adicionar Linha
              </button>
            </div>
            
            {specs.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-4 border border-dashed border-slate-200 rounded-lg">Nenhuma especificação técnica definida.</p>
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
                      className="w-1/3 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand"
                    />
                    <input 
                      type="text" placeholder="Ex: 4 portas" value={spec.value}
                      onChange={(e) => {
                        const newSpecs = [...specs];
                        newSpecs[i].value = e.target.value;
                        setSpecs(newSpecs);
                      }}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand"
                    />
                    <button type="button" onClick={() => setSpecs(specs.filter((_, idx) => idx !== i))} className="p-2 text-slate-600 hover:text-red-400 bg-white border border-slate-200 hover:border-red-500/50 rounded-lg transition-colors">
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
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Organização</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Status *</label>
              <select 
                value={status} onChange={e => setStatus(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
              >
                <option value="Em estoque">Em estoque</option>
                <option value="Em falta">Em falta</option>
              </select>
            </div>

            {status === 'Em estoque' && (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Quantidade em Estoque</label>
                <input 
                  type="number" min="0" placeholder="Ex: 5"
                  value={stockCount} onChange={e => setStockCount(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Categoria *</label>
              <select 
                required
                value={category} onChange={e => setCategory(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-brand"
              >
                <option value="">Selecione uma categoria...</option>
                {categoriesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2 mt-4">Tags do Produto</label>
              
              <div className="flex gap-2 mb-3">
                <input 
                  type="text" 
                  placeholder="Nova tag..." 
                  value={newTagInput}
                  onChange={e => setNewTagInput(e.target.value)}
                  onKeyDown={handleCreateTag}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-brand"
                />
                <button 
                  type="button"
                  onClick={handleCreateTag}
                  className="bg-white hover:bg-slate-700 text-slate-900 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-slate-300"
                >
                  Criar
                </button>
              </div>

              {tagsList.length === 0 ? (
                <p className="text-xs text-slate-600">Nenhuma tag criada ainda. Digite acima para criar.</p>
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
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-600'
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
