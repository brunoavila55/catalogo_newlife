import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, UploadCloud, X, Check } from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { getImageUrl } from '../../../utils/image';

interface ProductOption {
  id: number;
  name: string;
}

export default function AnalysisForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [productId, setProductId] = useState<number | ''>('');
  const [products, setProducts] = useState<ProductOption[]>([]);
  
  const [speedTest1, setSpeedTest1] = useState('');
  const [speedTest2, setSpeedTest2] = useState('');
  const [speedTest3, setSpeedTest3] = useState('');
  const [observations, setObservations] = useState('');

  const isEditing = Boolean(id);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar lista de produtos para o select
        const pRes = await api.get('/products?limit=1000');
        if (pRes.ok) {
          const pData = await pRes.json();
          setProducts(pData.data.map((p: any) => ({ id: p.id, name: p.name })));
        }

        if (isEditing) {
          const aRes = await api.get(`/analysis/${id}`);
          if (aRes.ok) {
            const data = await aRes.json();
            setProductId(data.product_id);
            setSpeedTest1(data.speed_test_1_img || '');
            setSpeedTest2(data.speed_test_2_img || '');
            setSpeedTest3(data.speed_test_3_img || '');
            setObservations(data.observations || '');
          }
        }
      } catch (e) {
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleUpload = async (file: File | null, field: 1 | 2 | 3) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await api.post('/upload', formData);
      if (res.ok) {
        const data = await res.json();
        if (field === 1) setSpeedTest1(data.url);
        if (field === 2) setSpeedTest2(data.url);
        if (field === 3) setSpeedTest3(data.url);
        toast.success(`Upload do teste ${field} concluído`);
      } else {
        toast.error('Falha no upload');
      }
    } catch (e) {
      toast.error('Erro no upload');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      toast.error('Selecione um produto');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        product_id: Number(productId),
        speed_test_1_img: speedTest1,
        speed_test_2_img: speedTest2,
        speed_test_3_img: speedTest3,
        observations
      };

      const res = await api.post('/analysis', payload);
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Erro HTTP ${res.status}`);
      }

      toast.success('Análise salva com sucesso!');
      navigate('/gestor-nlf-admin/analise');
    } catch (e: any) {
      toast.error(`Erro ao salvar análise: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const renderUploadBox = (field: 1 | 2 | 3, value: string, setValue: (val: string) => void) => {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center">
        <span className="text-sm font-semibold text-slate-700 mb-3">Print Teste {field}</span>
        
        {value ? (
          <div className="relative w-full aspect-video bg-white rounded-lg border border-slate-200 overflow-hidden group">
            <img src={getImageUrl(value)} alt={`Teste ${field}`} className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={() => setValue('')}
              className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              title="Remover Imagem"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label className={`w-full aspect-video border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-brand hover:bg-brand/5 transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <UploadCloud size={24} className="text-slate-400 mb-2" />
            <span className="text-xs text-slate-500 font-medium">Clique para anexar</span>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleUpload(e.target.files[0], field);
                }
              }} 
            />
          </label>
        )}
      </div>
    );
  };

  if (loading) return <div className="text-slate-600 p-8">Carregando formulário...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto pb-16">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/gestor-nlf-admin/analise')}
          className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-white rounded-lg transition-colors border border-slate-200"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-slate-900">
          {isEditing ? 'Editar Análise (Homologação)' : 'Nova Análise (Homologação)'}
        </h2>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">Equipamento (Produto) *</label>
            <select
              value={productId}
              onChange={e => setProductId(e.target.value === '' ? '' : Number(e.target.value))}
              required
              disabled={isEditing}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 disabled:opacity-70 disabled:bg-slate-100"
            >
              <option value="">Selecione o equipamento...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {isEditing && <p className="text-xs text-slate-500 mt-1">O equipamento não pode ser alterado na edição.</p>}
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Prints de Testes de Velocidade</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderUploadBox(1, speedTest1, setSpeedTest1)}
              {renderUploadBox(2, speedTest2, setSpeedTest2)}
              {renderUploadBox(3, speedTest3, setSpeedTest3)}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Observações</h3>
            <label className="block text-sm font-medium text-slate-700 mb-1">Comportamento e Funcionamento</label>
            <textarea 
              value={observations}
              onChange={e => setObservations(e.target.value)}
              rows={6}
              placeholder="Descreva aqui observações sobre o funcionamento, estabilidade, etc."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 resize-y"
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit"
            disabled={saving || uploading}
            className="flex items-center gap-2 bg-brand text-slate-900 hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-bold shadow-lg shadow-brand/20 transition-all"
          >
            {saving ? <div className="animate-spin w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full"></div> : <Save size={20} />}
            {saving ? 'Salvando...' : 'Salvar Homologação'}
          </button>
        </div>
      </form>
    </div>
  );
}
