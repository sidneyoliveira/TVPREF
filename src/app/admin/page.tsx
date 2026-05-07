'use client';

import { useState, useEffect } from 'react';
import { Configuracoes, InstagramLink, useTvData } from '@/hooks/useTvData';
import { LogIn, Save, Plus, Trash2, LayoutDashboard } from 'lucide-react';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Dashboard state
  const { config, instagramLinks, loading } = useTvData();
  const [localConfig, setLocalConfig] = useState<Configuracoes>({ youtube_link: '', texto_aviso: '' });
  const [localInsta, setLocalInsta] = useState<InstagramLink[]>([]);
  const [newInstaUrl, setNewInstaUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Verificar se há autenticação salva no localStorage
    const isAuth = localStorage.getItem('adminAuthenticated') === 'true';
    if (isAuth) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      setLocalConfig(config);
      setLocalInsta(instagramLinks);
    }
  }, [config, instagramLinks, loading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        localStorage.setItem('adminAuthenticated', 'true');
        setIsAuthenticated(true);
      } else {
        setLoginError('Senha incorreta.');
      }
    } catch (error) {
      setLoginError('Erro ao tentar fazer login.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    setIsAuthenticated(false);
    setPassword('');
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtube_link: localConfig.youtube_link,
          texto_aviso: localConfig.texto_aviso,
        }),
      });

      if (!res.ok) throw new Error('Erro ao salvar');
      alert('Configurações salvas com sucesso! A TV foi atualizada.');
    } catch (error) {
      alert('Erro ao salvar as configurações.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const addInstagramLink = async () => {
    if (!newInstaUrl) return;
    try {
      const res = await fetch('/api/admin/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newInstaUrl }),
      });

      if (!res.ok) throw new Error('Erro ao adicionar');
      setNewInstaUrl('');
      // It will auto-refresh via realtime hook
    } catch (error) {
      alert('Erro ao adicionar link do Instagram.');
      console.error(error);
    }
  };

  const removeInstagramLink = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/instagram?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erro ao remover');
      // It will auto-refresh via realtime hook
    } catch (error) {
      alert('Erro ao remover link do Instagram.');
      console.error(error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-full">
              <LogIn className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Painel da TV - Prefeitura</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Senha de Acesso</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite a senha"
              required
            />
          </div>
          
          {loginError && <p className="text-red-500 text-sm mb-4">{loginError}</p>}
          
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="max-w-5xl mx-auto flex items-center justify-between gap-4 mb-8 bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <LayoutDashboard className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard de Controle da TV</h1>
            <p className="text-gray-500">Qualquer alteração feita aqui aparecerá instantaneamente na TV da recepção.</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          Sair
        </button>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Configurações Gerais */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">Configurações Principais</h2>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Link do YouTube (Jornal/Ao Vivo)</label>
            <input
              type="url"
              value={localConfig.youtube_link}
              onChange={(e) => setLocalConfig({...localConfig, youtube_link: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Texto Rotativo (Rodapé)</label>
            <textarea
              value={localConfig.texto_aviso}
              onChange={(e) => setLocalConfig({...localConfig, texto_aviso: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              placeholder="Ex: Campanha de vacinação amanhã..."
            />
          </div>

          <button
            onClick={saveConfig}
            disabled={isSaving}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Salvando...' : 'Salvar e Atualizar TV'}
          </button>
        </div>

        {/* Fila do Instagram */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">Fila do Instagram</h2>
          
          <div className="flex gap-2 mb-6">
            <input
              type="url"
              value={newInstaUrl}
              onChange={(e) => setNewInstaUrl(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Cole o link do post ou reel..."
            />
            <button
              onClick={addInstagramLink}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" /> Adicionar
            </button>
          </div>

          <div className="space-y-3">
            {localInsta.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum post na fila.</p>
            ) : (
              localInsta.map((post, index) => (
                <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="font-bold text-gray-400">#{index + 1}</span>
                    <a href={post.url} target="_blank" rel="noreferrer" className="text-blue-600 truncate hover:underline text-sm max-w-[200px]">
                      {post.url}
                    </a>
                  </div>
                  <button
                    onClick={() => removeInstagramLink(post.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Remover da fila"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">Os posts são exibidos na TV em um carrossel automático.</p>
        </div>
        
      </main>
    </div>
  );
}
