import { useState, useEffect } from 'react';
import { Lock, User, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      navigate('/gestor-nlf-admin/produtos');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await api.post('/admin/login', { username, password });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error('Credenciais inválidas');
        if (res.status === 404) throw new Error('A rota da API não foi encontrada (404)');
        if (res.status === 502) throw new Error('O NPM não conseguiu conectar na API (502 Gateway)');
        throw new Error(`Erro do servidor: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('adminToken', data.token);
        navigate('/gestor-nlf-admin/produtos');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-dark flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-brand/3 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="w-full max-w-md glass rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mb-4">
            <Lock size={22} className="text-brand" />
          </div>
          <h1 className="text-2xl text-white font-condensed">Acesso Restrito</h1>
          <p className="text-slate-500 text-sm mt-1">Painel administrativo New Life</p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 text-red-400 p-3.5 mb-6 text-sm border border-red-500/20 rounded-xl flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm text-slate-400 mb-2 font-medium">Usuário</label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-surface-dark border border-slate-800 text-white pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-all" 
                placeholder="admin"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2 font-medium">Senha</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-dark border border-slate-800 text-white pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-all" 
                placeholder="••••••••"
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark text-white font-bold uppercase tracking-widest py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-brand/20 mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
