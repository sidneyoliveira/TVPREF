'use client';

import { useState, useEffect } from 'react';
import { Configuracoes, InstagramLink, useTvData, CarouselImage } from '@/hooks/useTvData';
import { LogOut, Save, Plus, Trash2, Settings2, Eye } from 'lucide-react';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const { config, instagramLinks, carouselImages, loading, refetch } = useTvData();
  
  // Display mode state
  const [displayMode, setDisplayMode] = useState<'youtube' | 'image' | 'announcement' | 'carousel' | 'split'>('youtube');
  
  // Config state
  const [youtubeLink, setYoutubeLink] = useState('');
  const [aviso, setAviso] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  
  // Instagram state
  const [newInstaUrl, setNewInstaUrl] = useState('');
  
  // Carousel state
  const [newCarouselUrl, setNewCarouselUrl] = useState('');
  const [carouselTitle, setCarouselTitle] = useState('');
  const [carouselDescription, setCarouselDescription] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuthenticated') === 'true';
    if (isAuth) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      setYoutubeLink(config.youtube_link || '');
      setAviso(config.texto_aviso || '');
      setDisplayMode(config.display_mode || 'youtube');
      setImageUrl(config.image_url || '');
      setAnnouncementTitle(config.announcement_title || '');
      setAnnouncementText(config.announcement_text || '');
    }
  }, [config, loading]);

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
          youtube_link: youtubeLink,
          texto_aviso: aviso,
          display_mode: displayMode,
          image_url: imageUrl,
          announcement_title: announcementTitle,
          announcement_text: announcementText,
        }),
      });

      if (!res.ok) throw new Error('Erro ao salvar');
      refetch();
      alert('✅ Configurações salvas! A TV foi atualizada.');
    } catch (error) {
      alert('❌ Erro ao salvar as configurações.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const addInstagramLink = async () => {
    if (!newInstaUrl) {
      alert('Digite uma URL do Instagram');
      return;
    }
    try {
      const res = await fetch('/api/admin/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newInstaUrl }),
      });

      if (!res.ok) throw new Error('Erro ao adicionar');
      setNewInstaUrl('');
      refetch();
      alert('✅ Link adicionado!');
    } catch (error) {
      alert('❌ Erro ao adicionar link do Instagram.');
      console.error(error);
    }
  };

  const removeInstagramLink = async (id: string) => {
    if (!confirm('Tem certeza?')) return;
    try {
      const res = await fetch(`/api/admin/instagram?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erro ao remover');
      refetch();
    } catch (error) {
      alert('❌ Erro ao remover link do Instagram.');
      console.error(error);
    }
  };

  const addCarouselImage = async () => {
    if (!newCarouselUrl) {
      alert('Digite uma URL de imagem');
      return;
    }
    try {
      const res = await fetch('/api/admin/carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imagem_url: newCarouselUrl,
          titulo: carouselTitle,
          descricao: carouselDescription,
        }),
      });

      if (!res.ok) throw new Error('Erro ao adicionar');
      setNewCarouselUrl('');
      setCarouselTitle('');
      setCarouselDescription('');
      refetch();
      alert('✅ Imagem adicionada!');
    } catch (error) {
      alert('❌ Erro ao adicionar imagem ao carrossel.');
      console.error(error);
    }
  };

  const removeCarouselImage = async (id: string) => {
    if (!confirm('Tem certeza?')) return;
    try {
      const res = await fetch(`/api/admin/carousel?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erro ao remover');
      refetch();
    } catch (error) {
      alert('❌ Erro ao remover imagem.');
      console.error(error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl">
                <Settings2 className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <h2 className="text-3xl font-black text-white text-center mb-2">
              Painel de Controle
            </h2>
            <p className="text-gray-400 text-center mb-8">Prefeitura de Itarema</p>
            
            <div className="mb-6">
              <label className="block text-white font-semibold mb-3">Senha de Acesso</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite a senha"
                required
              />
            </div>
            
            {loginError && (
              <p className="text-red-400 text-sm mb-4 flex items-center gap-2">
                ⚠️ {loginError}
              </p>
            )}
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">TV Display Control</h1>
              <p className="text-blue-100 text-sm">Prefeitura de Itarema</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Display Mode Selector */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 mb-8 shadow-xl">
          <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
            <span>🎬</span> Modo de Exibição
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { mode: 'youtube', label: '▶️ YouTube', desc: 'Transmissão ao vivo' },
              { mode: 'image', label: '🖼️ Imagem', desc: 'Imagem fixa' },
              { mode: 'announcement', label: '📢 Aviso', desc: 'Grande aviso' },
              { mode: 'carousel', label: '🎠 Carrossel', desc: 'Múltiplas imagens' },
              { mode: 'split', label: '➕ Dividido', desc: 'YouTube + Social' },
            ].map(({ mode, label, desc }) => (
              <button
                key={mode}
                onClick={() => setDisplayMode(mode as any)}
                className={`p-4 rounded-xl transition-all duration-200 font-semibold text-center ${
                  displayMode === mode
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/10'
                }`}
              >
                <div>{label}</div>
                <div className="text-xs opacity-70 mt-1">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Config Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* YouTube & Aviso */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-xl">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <span>▶️</span> YouTube
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-3">Link do YouTube</label>
                <input
                  type="url"
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            </div>

            <h3 className="text-xl font-black text-white mb-6 mt-8 flex items-center gap-2">
              <span>📢</span> Aviso (Rodapé)
            </h3>
            <div>
              <label className="block text-white font-semibold mb-3">Texto do Aviso</label>
              <textarea
                value={aviso}
                onChange={(e) => setAviso(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-none"
                placeholder="Ex: Campanha de vacinação amanhã..."
              />
            </div>
          </div>

          {/* Image & Announcement */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-xl">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <span>🖼️</span> Imagem
            </h3>
            <div className="space-y-4">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="URL da imagem"
              />
            </div>

            <h3 className="text-xl font-black text-white mb-6 mt-8 flex items-center gap-2">
              <span>📢</span> Grande Aviso
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Título do aviso"
              />
              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none"
                placeholder="Texto do aviso"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={saveConfig}
          disabled={isSaving}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 mb-8 text-lg"
        >
          <Save className="w-6 h-6" />
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </button>

        {/* Instagram Links */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-xl mb-8">
          <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
            <span>📱</span> Posts do Instagram
          </h3>
          <div className="flex gap-3 mb-6">
            <input
              type="url"
              value={newInstaUrl}
              onChange={(e) => setNewInstaUrl(e.target.value)}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Cole o link do post do Instagram..."
            />
            <button
              onClick={addInstagramLink}
              className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white px-6 rounded-lg font-bold flex items-center gap-2 transition-all"
            >
              <Plus className="w-5 h-5" /> Adicionar
            </button>
          </div>

          {instagramLinks.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Nenhum post na fila.</p>
          ) : (
            <div className="space-y-3">
              {instagramLinks.map((post, index) => (
                <div key={post.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="font-bold text-blue-400 text-lg">#{index + 1}</span>
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:text-blue-300 truncate text-sm underline"
                    >
                      {post.url}
                    </a>
                  </div>
                  <button
                    onClick={() => removeInstagramLink(post.id)}
                    className="text-red-400 hover:text-red-300 p-2 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Carousel Images */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-xl">
          <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
            <span>🎠</span> Imagens do Carrossel
          </h3>
          <div className="space-y-4 mb-6">
            <input
              type="url"
              value={newCarouselUrl}
              onChange={(e) => setNewCarouselUrl(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="URL da imagem"
            />
            <input
              type="text"
              value={carouselTitle}
              onChange={(e) => setCarouselTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Título (opcional)"
            />
            <textarea
              value={carouselDescription}
              onChange={(e) => setCarouselDescription(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
              placeholder="Descrição (opcional)"
            />
            <button
              onClick={addCarouselImage}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-5 h-5" /> Adicionar Imagem
            </button>
          </div>

          {carouselImages.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Nenhuma imagem no carrossel.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {carouselImages.map((img, index) => (
                <div key={img.id} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:border-white/30 transition-all">
                  <img
                    src={img.imagem_url}
                    alt={img.titulo}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-blue-400 mb-2">#{index + 1}</div>
                        {img.titulo && (
                          <h4 className="text-white font-bold truncate mb-1">{img.titulo}</h4>
                        )}
                        {img.descricao && (
                          <p className="text-gray-400 text-sm line-clamp-2">{img.descricao}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeCarouselImage(img.id)}
                        className="text-red-400 hover:text-red-300 p-2 flex-shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
