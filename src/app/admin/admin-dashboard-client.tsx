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
  Pencil,
  Plus,
  Save,
  Search,
  SplitSquareHorizontal,
  Trash2,
  Tv,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useTvData } from "@/hooks/useTvData";
import { notifyTvDataChange } from "@/lib/tv-sync";
import { DISPLAY_MODES, type Announcement, type Configuracoes, type DisplayMode } from "@/lib/types";
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
  theme_primary_color: string;
  theme_secondary_color: string;
  theme_accent_color: string;
};

type AnnouncementFormState = {
  title: string;
  text: string;
  bg_color: string;
  text_color: string;
  ordem: number;
  is_active: boolean;
};

type PersistOptions = {
  successMessage?: string;
  silent?: boolean;
  partial?: boolean;
};

type AuthStatus = "checking" | "authenticated" | "anonymous";

type LoginResponse = {
  authenticated?: boolean;
};

type ErrorResponse = {
  error?: string;
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
  theme_primary_color: "#08244f",
  theme_secondary_color: "#04142e",
  theme_accent_color: "#2b7be4",
};

const DEFAULT_ANNOUNCEMENT_FORM: AnnouncementFormState = {
  title: "",
  text: "",
  bg_color: "#123a70",
  text_color: "#ffffff",
  ordem: 0,
  is_active: true,
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

const MODE_LABELS = MODE_OPTIONS.reduce(
  (labels, mode) => ({
    ...labels,
    [mode.id]: mode.label,
  }),
  {} as Record<DisplayMode, string>,
);

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
    theme_primary_color: config.theme_primary_color || DEFAULT_FORM.theme_primary_color,
    theme_secondary_color: config.theme_secondary_color || DEFAULT_FORM.theme_secondary_color,
    theme_accent_color: config.theme_accent_color || DEFAULT_FORM.theme_accent_color,
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
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [password, setPassword] = useState("");
  const [form, setForm] = useState<ConfigFormState>(DEFAULT_FORM);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newInstagramUrl, setNewInstagramUrl] = useState("");
  const [instagramFilter, setInstagramFilter] = useState("");
  const [mediaFilter, setMediaFilter] = useState("");
  const [announcementForm, setAnnouncementForm] = useState<AnnouncementFormState>(DEFAULT_ANNOUNCEMENT_FORM);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const carouselInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const { config, instagramLinks, carouselImages, announcements, loading, refetch } = useTvData();

  useEffect(() => {
    let active = true;

    void fetch("/api/login", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return false;
        const payload = (await response.json()) as LoginResponse;
        return Boolean(payload.authenticated);
      })
      .catch(() => false)
      .then((authenticated) => {
        if (!active) return;
        setAuthStatus(authenticated ? "authenticated" : "anonymous");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setPreviewScale(entry.contentRect.width / 1920);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [authStatus]);

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
  const activeAnnouncementsCount = announcements.filter((announcement) => announcement.is_active).length;

  async function ensureOk(response: Response, fallbackMessage: string) {
    if (response.ok) return;

    const payload = (await response.json().catch(() => null)) as ErrorResponse | null;
    const message = payload?.error || fallbackMessage;

    if (response.status === 401) {
      setAuthStatus("anonymous");
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    throw new Error(message);
  }

  async function persistConfig(overrides: Partial<ConfigFormState> = {}, options: PersistOptions = {}) {
    const payload = {
      ...form,
      ...overrides,
    };
    const payloadWithThemeLetreiro = {
      ...payload,
      aviso_bg_color: payload.theme_primary_color,
      aviso_text_color: "#ffffff",
    };
    const requestPayload = options.partial ? overrides : payloadWithThemeLetreiro;

    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      await ensureOk(response, "Falha ao salvar configurações");

      if (options.partial) {
        setForm((current) => ({ ...current, ...overrides }));
      } else {
        setForm(payloadWithThemeLetreiro);
      }
      notifyTvDataChange();
      await refetch();

      if (!options.silent) {
        toast.success(options.successMessage || "Configurações salvas.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar configurações.");
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

      setAuthStatus("authenticated");
      setPassword("");
      toast.success("Login realizado.");
    } catch {
      toast.error("Erro ao tentar fazer login.");
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/login", { method: "DELETE" });
    } finally {
      setAuthStatus("anonymous");
      setPassword("");
    }
  }

  async function handleModeChange(mode: DisplayMode) {
    if (mode === form.display_mode) return;

    const previousMode = form.display_mode;
    setForm((current) => ({ ...current, display_mode: mode }));

    try {
      await persistConfig(
        { display_mode: mode },
        { successMessage: `Modo alterado para ${MODE_LABELS[mode]}.`, partial: true },
      );
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
        {
          successMessage: nextValue ? "Instagram lateral ligado." : "Instagram lateral desligado.",
          partial: true,
        },
      );
    } catch {
      setForm((current) => ({ ...current, show_instagram: !nextValue }));
    }
  }

  async function uploadFileToSupabase(file: File) {
    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      await ensureOk(response, "Falha no upload");

      const payload = (await response.json()) as { publicUrl?: string };
      return payload.publicUrl || null;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : 'Erro no upload. Confira o bucket "media".');
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

      await ensureOk(response, "Falha ao salvar mídia");

      notifyTvDataChange();
      await refetch();
      toast.success("Mídia adicionada ao carrossel.", { id: "upload-carousel" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar mídia.", { id: "upload-carousel" });
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

      await ensureOk(response, "Falha ao adicionar link");

      setNewInstagramUrl("");
      notifyTvDataChange();
      await refetch();
      toast.success("Post adicionado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao adicionar link.");
    }
  }

  async function removeInstagramLink(id: string) {
    if (!window.confirm("Remover este post?")) return;

    try {
      const response = await fetch(`/api/admin/instagram?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await ensureOk(response, "Falha ao remover link");

      notifyTvDataChange();
      await refetch();
      toast.success("Post removido.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover post.");
    }
  }

  async function removeCarouselImage(id: string) {
    if (!window.confirm("Remover esta mídia?")) return;

    try {
      const response = await fetch(`/api/admin/carousel?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await ensureOk(response, "Falha ao remover mídia");

      notifyTvDataChange();
      await refetch();
      toast.success("Mídia removida.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover mídia.");
    }
  }

  function resetAnnouncementForm() {
    setAnnouncementForm(DEFAULT_ANNOUNCEMENT_FORM);
    setEditingAnnouncementId(null);
  }

  function editAnnouncement(announcement: Announcement) {
    setEditingAnnouncementId(announcement.id);
    setAnnouncementForm({
      title: announcement.title,
      text: announcement.text,
      bg_color: announcement.bg_color,
      text_color: announcement.text_color,
      ordem: announcement.ordem,
      is_active: announcement.is_active,
    });
  }

  async function saveAnnouncement() {
    const title = announcementForm.title.trim();
    const text = announcementForm.text.trim();

    if (!title || !text) {
      toast.error("Preencha título e texto do aviso.");
      return;
    }

    setIsSavingAnnouncement(true);

    try {
      const response = await fetch("/api/admin/announcements", {
        method: editingAnnouncementId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...announcementForm,
          id: editingAnnouncementId,
          title,
          text,
          ordem: announcementForm.ordem || announcements.length + 1,
        }),
      });

      await ensureOk(response, "Falha ao salvar aviso");

      resetAnnouncementForm();
      notifyTvDataChange();
      await refetch();
      toast.success(editingAnnouncementId ? "Aviso atualizado." : "Aviso criado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar aviso.");
    } finally {
      setIsSavingAnnouncement(false);
    }
  }

  async function removeAnnouncement(id: string) {
    if (!window.confirm("Remover este aviso?")) return;

    try {
      const response = await fetch(`/api/admin/announcements?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await ensureOk(response, "Falha ao remover aviso");

      if (editingAnnouncementId === id) {
        resetAnnouncementForm();
      }

      notifyTvDataChange();
      await refetch();
      toast.success("Aviso removido.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover aviso.");
    }
  }

  async function toggleAnnouncement(announcement: Announcement) {
    try {
      const response = await fetch("/api/admin/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...announcement,
          is_active: !announcement.is_active,
        }),
      });

      await ensureOk(response, "Falha ao alterar aviso");

      notifyTvDataChange();
      await refetch();
      toast.success(!announcement.is_active ? "Aviso ativado." : "Aviso pausado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao alterar aviso.");
    }
  }

  if (authStatus === "checking") {
    return (
      <main className="admin-login-shell">
        <div className="admin-login-card">
          <div className="admin-login-logo">
            <Image src={logoBranca} alt="Prefeitura de Itarema" height={58} priority className="admin-logo-image" />
          </div>
          <div className="admin-skeleton admin-login-auth-skeleton" />
          <div className="admin-skeleton admin-login-auth-line" />
        </div>
      </main>
    );
  }

  if (authStatus !== "authenticated") {
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
              <p>
                {loading
                  ? "Sincronizando"
                  : `${carouselImages.length} mídias | ${instagramLinks.length} posts | ${activeAnnouncementsCount} avisos`}
              </p>
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
            <span>{isSaving ? "Salvando" : "Salvar conteúdo"}</span>
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
          </Panel>

          <Panel title="Tema da TV" icon={MonitorPlay}>
            <div
              className="admin-theme-preview"
              style={{ backgroundColor: form.theme_primary_color, borderColor: form.theme_accent_color }}
            >
              <span style={{ backgroundColor: form.theme_secondary_color }} />
              <span style={{ backgroundColor: form.theme_accent_color }} />
            </div>
            <div className="admin-theme-presets">
              <button
                type="button"
                className="admin-button admin-button-outline"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    theme_primary_color: "#08244f",
                    theme_secondary_color: "#04142e",
                    theme_accent_color: "#2b7be4",
                  }))
                }
              >
                Azul padrão
              </button>
            </div>
            <div className="admin-color-grid">
              <label className="admin-field-stack">
                <FieldLabel>Cor principal</FieldLabel>
                <input
                  type="color"
                  value={form.theme_primary_color}
                  onChange={(event) => setForm((current) => ({ ...current, theme_primary_color: event.target.value }))}
                  className="admin-color-input"
                />
              </label>
              <label className="admin-field-stack">
                <FieldLabel>Cor base</FieldLabel>
                <input
                  type="color"
                  value={form.theme_secondary_color}
                  onChange={(event) => setForm((current) => ({ ...current, theme_secondary_color: event.target.value }))}
                  className="admin-color-input"
                />
              </label>
              <label className="admin-field-stack admin-field-wide">
                <FieldLabel>Destaque</FieldLabel>
                <input
                  type="color"
                  value={form.theme_accent_color}
                  onChange={(event) => setForm((current) => ({ ...current, theme_accent_color: event.target.value }))}
                  className="admin-color-input"
                />
              </label>
            </div>
          </Panel>
        </div>

        <div className="admin-column admin-column-wide">
          <Panel title="Pré-visualização (16:9 - TV 43&quot;)" icon={Tv}>
            <div className="admin-tv-preview" ref={previewRef}>
              <iframe 
                src="/" 
                title="TV Live Preview"
                style={{
                  width: "1920px",
                  height: "1080px",
              maxWidth: "none",
              pointerEvents: "none",
                  transform: `scale(${previewScale})`
                }}
              />
            </div>
          </Panel>

          <Panel title="Imagem Fixa / Fallback" icon={LayoutTemplate}>
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

          <Panel title="Avisos de Tela" icon={Megaphone}>
            <div className="admin-announcement-editor">
              <div className="admin-content-form admin-announcement-form">
                <div className="admin-field-stack">
                  <FieldLabel>Título</FieldLabel>
                  <input
                    type="text"
                    value={announcementForm.title}
                    onChange={(event) =>
                      setAnnouncementForm((current) => ({ ...current, title: event.target.value }))
                    }
                    className="admin-control"
                    placeholder="Ex: Aviso importante"
                  />
                </div>
                <div className="admin-field-stack">
                  <FieldLabel>Ordem</FieldLabel>
                  <input
                    type="number"
                    min={0}
                    value={announcementForm.ordem}
                    onChange={(event) =>
                      setAnnouncementForm((current) => ({ ...current, ordem: Number(event.target.value) }))
                    }
                    className="admin-control"
                  />
                </div>
                <div className="admin-field-stack admin-content-text admin-announcement-text-field">
                  <FieldLabel>Texto</FieldLabel>
                  <textarea
                    value={announcementForm.text}
                    onChange={(event) =>
                      setAnnouncementForm((current) => ({ ...current, text: event.target.value }))
                    }
                    className="admin-control admin-textarea admin-textarea-large"
                    placeholder="Mensagem exibida em tela cheia"
                  />
                </div>
                <div className="admin-color-grid admin-announcement-color-grid">
                  <label className="admin-field-stack">
                    <FieldLabel>Fundo</FieldLabel>
                    <input
                      type="color"
                      value={announcementForm.bg_color}
                      onChange={(event) =>
                        setAnnouncementForm((current) => ({ ...current, bg_color: event.target.value }))
                      }
                      className="admin-color-input"
                    />
                  </label>
                  <label className="admin-field-stack">
                    <FieldLabel>Fonte</FieldLabel>
                    <input
                      type="color"
                      value={announcementForm.text_color}
                      onChange={(event) =>
                        setAnnouncementForm((current) => ({ ...current, text_color: event.target.value }))
                      }
                      className="admin-color-input"
                    />
                  </label>
                </div>
              </div>

              <div className="admin-announcement-actions">
                <label className="admin-check-row">
                  <input
                    type="checkbox"
                    checked={announcementForm.is_active}
                    onChange={(event) =>
                      setAnnouncementForm((current) => ({ ...current, is_active: event.target.checked }))
                    }
                  />
                  Ativo
                </label>
                {editingAnnouncementId && (
                  <button type="button" onClick={resetAnnouncementForm} className="admin-button admin-button-ghost">
                    <X size={16} />
                    <span>Cancelar</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={saveAnnouncement}
                  disabled={isSavingAnnouncement}
                  className="admin-button admin-button-primary"
                >
                  <Save size={16} />
                  <span>{editingAnnouncementId ? "Atualizar" : "Criar aviso"}</span>
                </button>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table admin-announcement-table">
                <thead>
                  <tr>
                    <th className="admin-col-order">#</th>
                    <th>Aviso</th>
                    <th className="admin-col-status">Status</th>
                    <th className="admin-col-action">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="admin-empty-cell">
                        Nenhum aviso criado.
                      </td>
                    </tr>
                  ) : (
                    announcements.map((announcement) => (
                      <tr key={announcement.id}>
                        <td className="admin-muted">{announcement.ordem}</td>
                        <td>
                          <div className="admin-table-primary">{announcement.title}</div>
                          <div className="admin-table-secondary">{announcement.text}</div>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => toggleAnnouncement(announcement)}
                            className={`admin-status-pill ${announcement.is_active ? "is-active" : ""}`}
                          >
                            {announcement.is_active ? "Ativo" : "Pausado"}
                          </button>
                        </td>
                        <td className="admin-cell-action">
                          <button
                            type="button"
                            onClick={() => editAnnouncement(announcement)}
                            className="admin-icon-button"
                            aria-label="Editar aviso"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAnnouncement(announcement.id)}
                            className="admin-icon-button"
                            aria-label="Remover aviso"
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
