"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  GalleryHorizontal,
  Image as ImageIcon,
  LayoutTemplate,
  Link2,
  LogOut,
  Megaphone,
  MonitorPlay,
  Plus,
  Save,
  Search,
  SplitSquareHorizontal,
  Trash2,
  Tv,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { useTvData } from "@/hooks/useTvData";
import { supabase } from "@/lib/supabase";
import { DISPLAY_MODES, type Configuracoes, type DisplayMode } from "@/lib/types";
import logoBranca from "@/img/logo_branca.png";

type ConfigFormState = {
  youtube_link: string;
  texto_aviso: string;
  aviso_bg_color: string;
  aviso_text_color: string;
  display_mode: DisplayMode;
  image_url: string;
  announcement_title: string;
  announcement_text: string;
  show_instagram: boolean;
};

type PersistOptions = {
  successMessage?: string;
  silent?: boolean;
};

const DEFAULT_FORM: ConfigFormState = {
  youtube_link: "",
  texto_aviso: "",
  aviso_bg_color: "#123a70",
  aviso_text_color: "#ffffff",
  display_mode: "youtube",
  image_url: "",
  announcement_title: "",
  announcement_text: "",
  show_instagram: false,
};

const MODE_OPTIONS: Array<{
  id: DisplayMode;
  label: string;
  icon: typeof Tv;
}> = [
  { id: "youtube", label: "YouTube", icon: Tv },
  { id: "image", label: "Imagem", icon: ImageIcon },
  { id: "announcement", label: "Aviso", icon: Megaphone },
  { id: "carousel", label: "Carrossel", icon: GalleryHorizontal },
  { id: "split", label: "Split", icon: SplitSquareHorizontal },
];

function toFormState(config: Configuracoes): ConfigFormState {
  return {
    youtube_link: config.youtube_link || "",
    texto_aviso: config.texto_aviso || "",
    aviso_bg_color: config.aviso_bg_color || DEFAULT_FORM.aviso_bg_color,
    aviso_text_color: config.aviso_text_color || DEFAULT_FORM.aviso_text_color,
    display_mode: DISPLAY_MODES.includes(config.display_mode) ? config.display_mode : DEFAULT_FORM.display_mode,
    image_url: config.image_url || "",
    announcement_title: config.announcement_title || "",
    announcement_text: config.announcement_text || "",
    show_instagram: Boolean(config.show_instagram),
  };
}

function fileNameFromUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    return decodeURIComponent(parsedUrl.pathname.split("/").pop() || "midia");
  } catch {
    return url.split("/").pop() || "midia";
  }
}

function createMediaFileName(fileExtension: string) {
  const fallbackId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : fallbackId;

  return `${id}.${fileExtension}`;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="admin-field-label">{children}</label>;
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Tv; children: React.ReactNode }) {
  return (
    <section className="admin-panel">
      <h2 className="admin-panel-title">
        <Icon size={16} className="admin-panel-icon" />
        {title}
      </h2>
      {children}
    </section>
  );
}

export function AdminDashboardClient() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("adminAuthenticated") === "true",
  );
  const [password, setPassword] = useState("");
  const [form, setForm] = useState<ConfigFormState>(DEFAULT_FORM);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newInstagramUrl, setNewInstagramUrl] = useState("");
  const [instagramFilter, setInstagramFilter] = useState("");
  const [mediaFilter, setMediaFilter] = useState("");

  const imageInputRef = useRef<HTMLInputElement>(null);
  const carouselInputRef = useRef<HTMLInputElement>(null);

  const { config, instagramLinks, carouselImages, loading, refetch } = useTvData();

  useEffect(() => {
    if (!loading && !hasInitialized) {
      const timer = setTimeout(() => {
        setForm(toFormState(config));
        setHasInitialized(true);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [config, hasInitialized, loading]);

  const filteredInstagramLinks = useMemo(() => {
    const query = instagramFilter.trim().toLowerCase();
    if (!query) return instagramLinks;
    return instagramLinks.filter((post) => post.url.toLowerCase().includes(query));
  }, [instagramFilter, instagramLinks]);

  const filteredCarouselImages = useMemo(() => {
    const query = mediaFilter.trim().toLowerCase();
    if (!query) return carouselImages;
    return carouselImages.filter((media) =>
      [media.imagem_url, media.titulo, media.descricao].filter(Boolean).join(" ").toLowerCase().includes(query),
    );
  }, [carouselImages, mediaFilter]);

  const currentMode = MODE_OPTIONS.find((mode) => mode.id === form.display_mode) ?? MODE_OPTIONS[0];

  async function persistConfig(overrides: Partial<ConfigFormState> = {}, options: PersistOptions = {}) {
    const payload = {
      ...form,
      ...overrides,
    };

    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Falha ao salvar configurações");
      }

      setForm(payload);
      await refetch();

      if (!options.silent) {
        toast.success(options.successMessage || "Configurações salvas.");
      }
    } catch (error) {
      toast.error("Erro ao salvar configurações.");
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        toast.error("Senha incorreta.");
        return;
      }

      localStorage.setItem("adminAuthenticated", "true");
      setIsAuthenticated(true);
      toast.success("Login realizado.");
    } catch {
      toast.error("Erro ao tentar fazer login.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("adminAuthenticated");
    setIsAuthenticated(false);
    setPassword("");
  }

  async function handleModeChange(mode: DisplayMode) {
    const previousMode = form.display_mode;
    setForm((current) => ({ ...current, display_mode: mode }));

    try {
      await persistConfig({ display_mode: mode }, { successMessage: `Modo alterado para ${mode}.` });
    } catch {
      setForm((current) => ({ ...current, display_mode: previousMode }));
    }
  }

  async function toggleShowInstagram() {
    const nextValue = !form.show_instagram;
    setForm((current) => ({ ...current, show_instagram: nextValue }));

    try {
      await persistConfig(
        { show_instagram: nextValue },
        { successMessage: nextValue ? "Instagram lateral ligado." : "Instagram lateral desligado." },
      );
    } catch {
      setForm((current) => ({ ...current, show_instagram: !nextValue }));
    }
  }

  async function uploadFileToSupabase(file: File) {
    try {
      setIsUploading(true);

      const fileExt = file.name.split(".").pop() || "bin";
      const filePath = `uploads/${createMediaFileName(fileExt)}`;

      const { error: uploadError } = await supabase.storage.from("media").upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("media").getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error('Erro no upload. Confira o bucket "media".');
      return null;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSingleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    toast.loading("Enviando imagem...", { id: "upload-image" });
    const imageUrl = await uploadFileToSupabase(file);

    if (imageUrl) {
      setForm((current) => ({ ...current, image_url: imageUrl }));
      toast.success("Imagem carregada.", { id: "upload-image" });
    } else {
      toast.dismiss("upload-image");
    }

    event.target.value = "";
  }

  async function handleCarouselUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    toast.loading("Enviando mídia...", { id: "upload-carousel" });
    const mediaUrl = await uploadFileToSupabase(file);

    if (!mediaUrl) {
      toast.dismiss("upload-carousel");
      event.target.value = "";
      return;
    }

    try {
      const response = await fetch("/api/admin/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagem_url: mediaUrl, titulo: "", descricao: "" }),
      });

      if (!response.ok) throw new Error("Falha ao salvar mídia");

      await refetch();
      toast.success("Mídia adicionada ao carrossel.", { id: "upload-carousel" });
    } catch {
      toast.error("Erro ao salvar mídia.", { id: "upload-carousel" });
    } finally {
      event.target.value = "";
    }
  }

  async function addInstagramLink() {
    const url = newInstagramUrl.trim();

    if (!url) {
      toast.error("Informe uma URL do Instagram.");
      return;
    }

    try {
      const response = await fetch("/api/admin/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error("Falha ao adicionar link");

      setNewInstagramUrl("");
      await refetch();
      toast.success("Post adicionado.");
    } catch {
      toast.error("Erro ao adicionar link.");
    }
  }

  async function removeInstagramLink(id: string) {
    if (!window.confirm("Remover este post?")) return;

    try {
      const response = await fetch(`/api/admin/instagram?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Falha ao remover link");

      await refetch();
      toast.success("Post removido.");
    } catch {
      toast.error("Erro ao remover post.");
    }
  }

  async function removeCarouselImage(id: string) {
    if (!window.confirm("Remover esta mídia?")) return;

    try {
      const response = await fetch(`/api/admin/carousel?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Falha ao remover mídia");

      await refetch();
      toast.success("Mídia removida.");
    } catch {
      toast.error("Erro ao remover mídia.");
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="admin-login-shell">
        <form onSubmit={handleLogin} className="admin-login-card">
          <div className="admin-login-logo">
            <Image src={logoBranca} alt="Prefeitura de Itarema" height={58} priority className="admin-logo-image" />
          </div>
          <h1 className="admin-login-title">Painel TV</h1>
          <p className="admin-login-subtitle">Sistema de comunicação</p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="admin-control admin-login-input"
            placeholder="Senha de acesso"
            required
          />
          <button type="submit" className="admin-button admin-button-primary admin-button-full">
            Entrar
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-brand">
            <div className="admin-brand-icon">
              <MonitorPlay size={19} strokeWidth={2.4} />
            </div>
            <div className="admin-brand-text">
              <h1>Controle da TV</h1>
              <p>{loading ? "Sincronizando" : `${carouselImages.length} mídias | ${instagramLinks.length} posts`}</p>
            </div>
          </div>

          <div className="admin-header-actions">
            <span className="admin-live-pill">ON AIR</span>
            <button
              type="button"
              onClick={() => {
                void persistConfig({}, { successMessage: "TV atualizada." }).catch(() => undefined);
              }}
              disabled={isSaving}
              className="admin-button admin-button-success"
            >
              <Save size={16} />
              <span>{isSaving ? "Salvando" : "Salvar"}</span>
            </button>
            <button type="button" onClick={handleLogout} className="admin-button admin-button-ghost">
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="admin-layout">
        <div className="admin-column">
          <Panel title="No Ar Agora" icon={MonitorPlay}>
            <div className="admin-live-summary">
              <div>
                <p className="admin-muted">Modo ativo</p>
                <p className="admin-strong">{currentMode.label}</p>
              </div>
              <button
                type="button"
                onClick={toggleShowInstagram}
                className={`admin-button admin-button-toggle ${form.show_instagram ? "is-active" : ""}`}
              >
                Instagram {form.show_instagram ? "ON" : "OFF"}
              </button>
            </div>

            <div className="admin-mode-grid">
              {MODE_OPTIONS.map((mode) => {
                const Icon = mode.icon;
                const isActive = form.display_mode === mode.id;

                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => handleModeChange(mode.id)}
                    className={`admin-mode-button ${isActive ? "is-active" : ""}`}
                  >
                    <Icon size={19} />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel title="Transmissão" icon={Tv}>
            <div className="admin-field-stack">
              <FieldLabel>Link do YouTube</FieldLabel>
              <div className="admin-input-shell">
                <Link2 size={15} className="admin-input-icon" />
                <input
                  type="url"
                  value={form.youtube_link}
                  onChange={(event) => setForm((current) => ({ ...current, youtube_link: event.target.value }))}
                  className="admin-control admin-control-borderless"
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>
          </Panel>

          <Panel title="Letreiro" icon={Megaphone}>
            <div className="admin-field-stack">
              <FieldLabel>Texto</FieldLabel>
              <textarea
                value={form.texto_aviso}
                onChange={(event) => setForm((current) => ({ ...current, texto_aviso: event.target.value }))}
                className="admin-control admin-textarea"
                placeholder="Mensagem exibida no rodapé"
              />
            </div>
            <div className="admin-color-grid">
              <label className="admin-field-stack">
                <FieldLabel>Fundo</FieldLabel>
                <input
                  type="color"
                  value={form.aviso_bg_color}
                  onChange={(event) => setForm((current) => ({ ...current, aviso_bg_color: event.target.value }))}
                  className="admin-color-input"
                />
              </label>
              <label className="admin-field-stack">
                <FieldLabel>Texto</FieldLabel>
                <input
                  type="color"
                  value={form.aviso_text_color}
                  onChange={(event) => setForm((current) => ({ ...current, aviso_text_color: event.target.value }))}
                  className="admin-color-input"
                />
              </label>
            </div>
          </Panel>
        </div>

        <div className="admin-column admin-column-wide">
          <Panel title="Conteúdo Principal" icon={LayoutTemplate}>
            <div className="admin-content-form">
              <div className="admin-field-stack">
                <FieldLabel>Título</FieldLabel>
                <input
                  type="text"
                  value={form.announcement_title}
                  onChange={(event) => setForm((current) => ({ ...current, announcement_title: event.target.value }))}
                  className="admin-control"
                  placeholder="Título do aviso ou imagem"
                />
              </div>
              <div className="admin-field-stack admin-content-text">
                <FieldLabel>Texto</FieldLabel>
                <textarea
                  value={form.announcement_text}
                  onChange={(event) => setForm((current) => ({ ...current, announcement_text: event.target.value }))}
                  className="admin-control admin-textarea admin-textarea-large"
                  placeholder="Descrição do aviso"
                />
              </div>
              <div className="admin-field-stack">
                <FieldLabel>Imagem fixa</FieldLabel>
                <input
                  type="file"
                  accept="image/*"
                  ref={imageInputRef}
                  className="admin-hidden-input"
                  onChange={handleSingleImageUpload}
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isUploading}
                  className="admin-button admin-button-outline admin-button-full"
                >
                  <UploadCloud size={16} />
                  <span>Enviar imagem</span>
                </button>
              </div>
            </div>

            {form.image_url && (
              <div className="admin-preview-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.image_url} alt="Preview da imagem fixa" className="admin-preview-image" />
              </div>
            )}
          </Panel>

          <Panel title="Galeria do Carrossel" icon={GalleryHorizontal}>
            <div className="admin-toolbar">
              <div className="admin-input-shell">
                <Search size={15} className="admin-input-icon" />
                <input
                  value={mediaFilter}
                  onChange={(event) => setMediaFilter(event.target.value)}
                  className="admin-control admin-control-borderless"
                  placeholder="Filtrar mídia"
                />
              </div>
              <input
                type="file"
                accept="image/*,video/mp4,video/webm"
                ref={carouselInputRef}
                className="admin-hidden-input"
                onChange={handleCarouselUpload}
              />
              <button
                type="button"
                onClick={() => carouselInputRef.current?.click()}
                disabled={isUploading}
                className="admin-button admin-button-primary"
              >
                <Plus size={16} />
                <span>Adicionar</span>
              </button>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="admin-col-order">#</th>
                    <th>Mídia</th>
                    <th className="admin-col-type">Tipo</th>
                    <th className="admin-col-action">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCarouselImages.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="admin-empty-cell">
                        Nenhuma mídia encontrada.
                      </td>
                    </tr>
                  ) : (
                    filteredCarouselImages.map((media) => (
                      <tr key={media.id}>
                        <td className="admin-muted">{media.ordem}</td>
                        <td>
                          <div className="admin-table-primary">{fileNameFromUrl(media.imagem_url)}</div>
                          {media.titulo && <div className="admin-table-secondary">{media.titulo}</div>}
                        </td>
                        <td className="admin-muted">{/\.(mp4|webm)$/i.test(media.imagem_url) ? "Vídeo" : "Imagem"}</td>
                        <td className="admin-cell-action">
                          <button
                            type="button"
                            onClick={() => removeCarouselImage(media.id)}
                            className="admin-icon-button"
                            aria-label="Remover mídia"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="admin-column">
          <Panel title="Posts do Instagram" icon={LayoutTemplate}>
            <div className="admin-field-stack">
              <div className="admin-input-shell">
                <Link2 size={15} className="admin-input-icon" />
                <input
                  type="url"
                  value={newInstagramUrl}
                  onChange={(event) => setNewInstagramUrl(event.target.value)}
                  className="admin-control admin-control-borderless"
                  placeholder="https://instagram.com/p/..."
                />
                <button type="button" onClick={addInstagramLink} className="admin-small-action" aria-label="Adicionar post">
                  <Plus size={16} />
                </button>
              </div>
              <div className="admin-input-shell">
                <Search size={15} className="admin-input-icon" />
                <input
                  value={instagramFilter}
                  onChange={(event) => setInstagramFilter(event.target.value)}
                  className="admin-control admin-control-borderless"
                  placeholder="Filtrar posts"
                />
              </div>
            </div>

            <div className="admin-table-wrap admin-table-tall">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="admin-col-order">#</th>
                    <th>URL</th>
                    <th className="admin-col-action">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstagramLinks.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="admin-empty-cell">
                        Nenhum post encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredInstagramLinks.map((post) => (
                      <tr key={post.id}>
                        <td className="admin-muted">{post.ordem}</td>
                        <td>
                          <a href={post.url} target="_blank" rel="noreferrer" className="admin-table-link">
                            {post.url}
                          </a>
                        </td>
                        <td className="admin-cell-action">
                          <button
                            type="button"
                            onClick={() => removeInstagramLink(post.id)}
                            className="admin-icon-button"
                            aria-label="Remover post"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}
