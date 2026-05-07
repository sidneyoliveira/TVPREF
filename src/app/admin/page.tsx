'use client';

import { useState, useEffect, useRef } from 'react';
import { Configuracoes, InstagramLink, useTvData, CarouselImage } from '@/hooks/useTvData';
import { LogOut, Save, Plus, Trash2, Settings2, MonitorPlay, Image as ImageIcon, Megaphone, GalleryHorizontal, LayoutTemplate, Tv, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  const { config, instagramLinks, carouselImages, loading, refetch } = useTvData();
  
  // Display mode state
  const [displayMode, setDisplayMode] = useState<'youtube' | 'image' | 'announcement' | 'carousel' | 'split'>('youtube');
  
  // Config state
  const [youtubeLink, setTvLink] = useState('');
  const [aviso, setAviso] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  
  // Instagram state
  const [newInstaUrl, setNewInstaUrl] = useState('');
  
  // Carousel state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const carouselFileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuthenticated') === 'true';
    if (isAuth) setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    if (!loading && !hasInitialized && config.display_mode) {
      setTvLink(config.youtube_link || '');
      setAviso(config.texto_aviso || '');
      setDisplayMode(config.display_mode || 'youtube');
      setImageUrl(config.image_url || '');
      setAnnouncementTitle(config.announcement_title || '');
      setAnnouncementText(config.announcement_text || '');
      setHasInitialized(true);
    }
  }, [config, loading, hasInitialized]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        localStorage.setItem('adminAuthenticated', 'true');
        setIsAuthenticated(true);
        toast.success('Login realizado com sucesso!');
      } else {
        toast.error('Senha incorreta.');
      }
    } catch {
      toast.error('Erro ao tentar fazer login.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    setIsAuthenticated(false);
    setPassword('');
  };

  const handleModeChange = async (mode: any) => {
    setDisplayMode(mode);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          youtube_link: youtubeLink,
          texto_aviso: aviso,
          image_url: imageUrl,
          announcement_title: announcementTitle,
          announcement_text: announcementText,
          display_mode: mode,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Modo TV alterado para ${mode.toUpperCase()}`);
      refetch();
    } catch {
      toast.error('Erro ao mudar o modo da TV');
    }
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
      toast.success('Configurações salvas e TV atualizada!');
    } catch {
      toast.error('Erro ao salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const uploadFileToSupabase = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('media').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao fazer upload da imagem. O bucket "media" está criado?');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSingleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    toast.loading('Enviando imagem...', { id: 'upload' });
    const url = await uploadFileToSupabase(file);
    if (url) {
      setImageUrl(url);
      toast.success('Imagem carregada!', { id: 'upload' });
    } else {
      toast.dismiss('upload');
    }
  };

  const handleCarouselImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.loading('Enviando para o carrossel...', { id: 'upload-carousel' });
    const url = await uploadFileToSupabase(file);
    
    if (url) {
      try {
        const res = await fetch('/api/admin/carousel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imagem_url: url, titulo: '', descricao: '' }),
        });
        if (!res.ok) throw new Error();
        refetch();
        toast.success('Adicionado ao carrossel!', { id: 'upload-carousel' });
      } catch {
        toast.error('Erro ao salvar no banco.', { id: 'upload-carousel' });
      }
    } else {
      toast.dismiss('upload-carousel');
    }
  };

  const addInstagramLink = async () => {
    if (!newInstaUrl) return toast.error('Digite uma URL do Instagram');
    try {
      const res = await fetch('/api/admin/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newInstaUrl }),
      });
      if (!res.ok) throw new Error();
      setNewInstaUrl('');
      refetch();
      toast.success('Link do Instagram adicionado!');
    } catch {
      toast.error('Erro ao adicionar link.');
    }
  };

  const removeInstagramLink = async (id: string) => {
    if (!confirm('Remover post?')) return;
    try {
      await fetch(`/api/admin/instagram?id=${id}`, { method: 'DELETE' });
      refetch();
      toast.success('Removido');
    } catch {
      toast.error('Erro ao remover.');
    }
  };

  const removeCarouselImage = async (id: string) => {
    if (!confirm('Remover imagem?')) return;
    try {
      await fetch(`/api/admin/carousel?id=${id}`, { method: 'DELETE' });
      refetch();
      toast.success('Removida');
    } catch {
      toast.error('Erro ao remover imagem.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center p-4 font-sans">
        <form onSubmit={handleLogin} className="w-full max-w-sm">
          <div className="bg-dark-bg-secondary border border-dark-border rounded-2xl p-8 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="bg-accent-blue p-4 rounded-2xl shadow-lg">
                <Settings2 className="w-10 h-10 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white text-center mb-1">Painel TV</h2>
            <p className="text-dark-text-secondary text-center mb-8 text-sm">Prefeitura Municipal</p>
            <div className="mb-6">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg-primary border border-dark-border rounded-xl text-white placeholder-dark-text-secondary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all"
                placeholder="Senha de Acesso"
                required
              />
            </div>
            <button type="submit" className="w-full bg-accent-blue hover:bg-accent-blue-hover text-white font-bold py-3 rounded-xl transition-all shadow-md">
              Entrar
            </button>
          </div>
        </form>
      </div>
    );
  }

  const modes = [
    { id: 'youtube', icon: Tv, label: 'YouTube' },
    { id: 'image', icon: ImageIcon, label: 'Imagem Fixa' },
    { id: 'announcement', icon: Megaphone, label: 'Aviso Grande' },
    { id: 'carousel', icon: GalleryHorizontal, label: 'Carrossel' },
    { id: 'split', icon: LayoutTemplate, label: 'Dividido (Tv + Social)' },
  ];

  return (
    <div className="min-h-screen bg-dark-bg-primary font-sans text-dark-text-primary pb-12">
      {/* Header Compacto */}
      <header className="bg-dark-bg-secondary border-b border-dark-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-accent-blue p-2 rounded-lg text-white">
              <MonitorPlay size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">Controle da TV</h1>
              <p className="text-dark-text-secondary text-xs">Transmissão em Tempo Real</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-dark-text-secondary hover:text-accent-red transition-colors text-sm font-semibold">
            <LogOut size={18} /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        
        {/* CONTROLE MESTRE DA TV (AO VIVO) */}
        <section className="bg-dark-bg-secondary border border-dark-border rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MonitorPlay className="text-accent-red" size={20} /> 
              No Ar Agora (LIVE)
            </h2>
            <span className="bg-accent-red/20 text-accent-red px-3 py-1 rounded-full text-xs font-bold animate-pulse">ON AIR</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {modes.map((m) => {
              const Icon = m.icon;
              const isActive = displayMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handleModeChange(m.id)}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                    isActive 
                    ? 'bg-accent-blue border-accent-blue text-white shadow-md transform scale-[1.02]' 
                    : 'bg-dark-bg-primary border-dark-border text-dark-text-secondary hover:border-dark-text-secondary'
                  }`}
                >
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-xs font-bold text-center leading-tight">{m.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* PAINEL DE EDIÇÃO (GRID COMPACTO) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* COLUNA ESQUERDA: Textos e Tv */}
          <div className="space-y-6">
            <section className="bg-dark-bg-secondary border border-dark-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Tv size={18} className="text-accent-red" /> Configurar YouTube
              </h3>
              <input
                type="url"
                value={youtubeLink}
                onChange={(e) => setTvLink(e.target.value)}
                className="w-full px-3 py-2 bg-dark-bg-primary border border-dark-border rounded-lg text-sm focus:border-accent-blue outline-none"
                placeholder="Link da Live (Tv)"
              />
            </section>

            <section className="bg-dark-bg-secondary border border-dark-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Megaphone size={18} className="text-accent-yellow" /> Letreiro de Rodapé
              </h3>
              <textarea
                value={aviso}
                onChange={(e) => setAviso(e.target.value)}
                className="w-full px-3 py-2 bg-dark-bg-primary border border-dark-border rounded-lg text-sm focus:border-accent-blue outline-none resize-none h-20"
                placeholder="Aviso que passa embaixo na TV"
              />
            </section>

            <section className="bg-dark-bg-secondary border border-dark-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Megaphone size={18} className="text-accent-purple" /> Aviso de Tela Cheia
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-bg-primary border border-dark-border rounded-lg text-sm focus:border-accent-blue outline-none"
                  placeholder="Título Principal"
                />
                <textarea
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-bg-primary border border-dark-border rounded-lg text-sm focus:border-accent-blue outline-none resize-none h-20"
                  placeholder="Texto do aviso"
                />
              </div>
            </section>

            <button
              onClick={saveConfig}
              disabled={isSaving}
              className="w-full bg-accent-green hover:bg-secondary-green text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg"
            >
              <Save size={20} /> {isSaving ? 'Salvando...' : 'Salvar Textos e Links'}
            </button>
          </div>

          {/* COLUNA DO MEIO: Mídias (Imagem e Carrossel) */}
          <div className="space-y-6">
            <section className="bg-dark-bg-secondary border border-dark-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <ImageIcon size={18} className="text-accent-cyan" /> Imagem Fixa
              </h3>
              <div className="space-y-3">
                {imageUrl && (
                  <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg border border-dark-border" />
                )}
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleSingleImageUpload} />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full bg-dark-bg-primary border border-dark-border hover:border-accent-blue text-dark-text-primary px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                >
                  <UploadCloud size={16} /> Enviar Imagem do PC/Celular
                </button>
              </div>
            </section>

            <section className="bg-dark-bg-secondary border border-dark-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <GalleryHorizontal size={18} className="text-accent-orange" /> Galeria Carrossel
              </h3>
              <div className="mb-4">
                <input type="file" accept="image/*" ref={carouselFileInputRef} className="hidden" onChange={handleCarouselImageUpload} />
                <button 
                  onClick={() => carouselFileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full bg-accent-blue hover:bg-accent-blue-hover text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                >
                  <Plus size={16} /> Adicionar Imagem ao Carrossel
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {carouselImages.length === 0 ? (
                  <p className="text-dark-text-secondary text-xs text-center py-4">Nenhuma imagem adicionada.</p>
                ) : (
                  carouselImages.map((img) => (
                    <div key={img.id} className="flex items-center gap-3 bg-dark-bg-primary p-2 rounded-lg border border-dark-border group">
                      <img src={img.imagem_url} className="w-16 h-12 object-cover rounded bg-black" alt="Carrossel" />
                      <div className="flex-1 min-w-0">
                         <p className="text-xs text-dark-text-secondary truncate">{img.imagem_url.split('/').pop()}</p>
                      </div>
                      <button onClick={() => removeCarouselImage(img.id)} className="text-dark-text-secondary hover:text-accent-red p-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* COLUNA DIREITA: Social Media */}
          <div className="space-y-6">
             <section className="bg-dark-bg-secondary border border-dark-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <LayoutTemplate size={18} className="text-accent-purple" /> Posts do Instagram
              </h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="url"
                  value={newInstaUrl}
                  onChange={(e) => setNewInstaUrl(e.target.value)}
                  className="flex-1 px-3 py-2 bg-dark-bg-primary border border-dark-border rounded-lg text-sm focus:border-accent-blue outline-none"
                  placeholder="Link do Post"
                />
                <button
                  onClick={addInstagramLink}
                  className="bg-accent-blue text-white p-2 rounded-lg hover:bg-accent-blue-hover transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {instagramLinks.length === 0 ? (
                  <p className="text-dark-text-secondary text-xs text-center py-4">Fila vazia.</p>
                ) : (
                  instagramLinks.map((post, i) => (
                    <div key={post.id} className="flex items-center gap-3 bg-dark-bg-primary p-3 rounded-lg border border-dark-border">
                      <span className="text-accent-blue font-bold text-xs w-4">{i + 1}</span>
                      <a href={post.url} target="_blank" rel="noreferrer" className="flex-1 text-xs text-dark-text-primary hover:text-accent-blue truncate">
                        {post.url}
                      </a>
                      <button onClick={() => removeInstagramLink(post.id)} className="text-dark-text-secondary hover:text-accent-red p-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

        </div>
      </main>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
