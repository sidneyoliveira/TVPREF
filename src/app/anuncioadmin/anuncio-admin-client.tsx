"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Clock3,
  ExternalLink,
  GripVertical,
  Image as ImageIcon,
  LogOut,
  Monitor,
  MonitorPlay,
  Plus,
  Save,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { AnuncioDisplay } from "@/components/AnuncioDisplay";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useAnuncioData } from "@/hooks/useAnuncioData";
import { notifyAnuncioDataChange } from "@/lib/anuncio-sync";
import {
  defaultAnuncioSettings,
  type AnuncioSettings,
  type AnuncioTransitionStyle,
  type SponsorLogo,
} from "@/lib/types";

type AuthStatus = "checking" | "authenticated" | "anonymous";

type LoginResponse = {
  authenticated?: boolean;
};

type ErrorResponse = {
  error?: string;
};

type PersistOptions = {
  successMessage?: string;
  silent?: boolean;
};

type TextSponsorFormState = {
  name: string;
  bg_color: string;
  text_color: string;
  font_size: number;
};

const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FRAME_DIMENSION = 2800;
const MAX_LOGO_DIMENSION = 1800;

const DEFAULT_TEXT_SPONSOR_FORM: TextSponsorFormState = {
  name: "",
  bg_color: "#123a70",
  text_color: "#ffffff",
  font_size: 48,
};

const TRANSITION_OPTIONS: Array<{ id: AnuncioTransitionStyle; label: string }> = [
  { id: "fade", label: "Fade" },
  { id: "zoom", label: "Zoom" },
  { id: "slide", label: "Slide" },
];

function getFileBaseName(fileName: string) {
  const cleanName = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim();
  return cleanName || "Patrocinador";
}

function isSupportedImage(file: File) {
  return SUPPORTED_IMAGE_TYPES.includes(file.type);
}

async function compressImage(file: File, maxDimension: number): Promise<File> {
  if (!isSupportedImage(file)) return file;

  return new Promise((resolve) => {
    const img = document.createElement("img");
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;
      const largestSide = Math.max(width, height);

      if (largestSide > maxDimension) {
        const scale = maxDimension / largestSide;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        resolve(file);
        return;
      }

      context.clearRect(0, 0, width, height);
      context.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          const compressedFile = new File(
            [blob],
            `${file.name.replace(/\.[^/.]+$/, "")}.webp`,
            { type: "image/webp", lastModified: Date.now() },
          );

          resolve(compressedFile.size < file.size || largestSide > maxDimension ? compressedFile : file);
        },
        "image/webp",
        0.88,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

function AnuncioFieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="anuncio-admin-field-label">{children}</span>;
}

function AnuncioPanel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Monitor;
  children: React.ReactNode;
}) {
  return (
    <section className="anuncio-admin-panel">
      <h2 className="anuncio-admin-panel-title">
        <Icon size={16} />
        {title}
      </h2>
      {children}
    </section>
  );
}

export function AnuncioAdminClient() {
  const { settings, loading, refetch } = useAnuncioData();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [password, setPassword] = useState("");
  const [draft, setDraft] = useState<AnuncioSettings>(defaultAnuncioSettings);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  const frameInputRef = useRef<HTMLInputElement>(null);
  const sponsorInputRef = useRef<HTMLInputElement>(null);
  const [textSponsorForm, setTextSponsorForm] = useState<TextSponsorFormState>(DEFAULT_TEXT_SPONSOR_FORM);

  const sortedSponsors = useMemo(
    () => [...draft.sponsors].sort((left, right) => left.ordem - right.ordem),
    [draft.sponsors],
  );

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

  async function persistSettings(nextSettings: AnuncioSettings, options: PersistOptions = {}) {
    setIsSaving(true);

    try {
      const response = await fetch("/api/anuncio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextSettings),
      });

      await ensureOk(response, "Falha ao salvar anúncio");

      const savedSettings = (await response.json()) as AnuncioSettings;
      setDraft(savedSettings);
      setIsDirty(false);
      notifyAnuncioDataChange();
      await refetch();

      if (!options.silent) {
        toast.success(options.successMessage || "Configurações salvas.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar anúncio.");
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  const {
    draggedId,
    handleDragStart,
    handleDragEnter,
    handleDragEnd,
  } = useDragAndDrop(sortedSponsors, (newSponsors) => {
    const now = new Date().toISOString();
    const nextSettings = {
      ...draft,
      sponsors: newSponsors.map((sponsor, index) => ({
        ...sponsor,
        ordem: index + 1,
        updated_at: now,
      })),
    };

    setDraft(nextSettings);
    void persistSettings(nextSettings, { successMessage: "Ordem atualizada.", silent: true }).catch(() => undefined);
  });

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
    if (loading) return;

    if (!hasInitialized || !isDirty) {
      const timer = window.setTimeout(() => {
        setDraft(settings);
        setHasInitialized(true);
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [hasInitialized, isDirty, loading, settings]);

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

  function updateDraft(patch: Partial<AnuncioSettings>) {
    setDraft((current) => ({ ...current, ...patch }));
    setIsDirty(true);
  }

  async function uploadImage(file: File, target: string, maxDimension: number) {
    if (!isSupportedImage(file)) {
      toast.error("Use uma imagem JPG, PNG ou WEBP.");
      return null;
    }

    setUploadingTarget(target);

    try {
      const processedFile = await compressImage(file, maxDimension);
      const formData = new FormData();
      formData.append("file", processedFile);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      await ensureOk(response, "Falha no upload");

      const payload = (await response.json()) as { publicUrl?: string };
      return payload.publicUrl || null;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro no upload.");
      return null;
    } finally {
      setUploadingTarget(null);
    }
  }

  async function handleFrameUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    toast.loading("Enviando moldura 3x3...", { id: "frame-square" });
    const imageUrl = await uploadImage(file, "frame-square", MAX_FRAME_DIMENSION);

    if (!imageUrl) {
      toast.dismiss("frame-square");
      return;
    }

    const nextSettings = {
      ...draft,
      frame_url: imageUrl,
    };

    setDraft(nextSettings);
    await persistSettings(nextSettings, {
      successMessage: "Moldura 3x3 salva.",
      silent: true,
    });
    toast.success("Moldura 3x3 enviada.", { id: "frame-square" });
  }

  async function handleSponsorUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) return;

    const invalidFiles = files.filter((file) => !isSupportedImage(file));
    if (invalidFiles.length > 0) {
      toast.error("Alguns arquivos foram ignorados. Use JPG, PNG ou WEBP.");
    }

    const validFiles = files.filter(isSupportedImage);
    if (validFiles.length === 0) return;

    toast.loading("Enviando patrocinadores...", { id: "sponsors-upload" });

    const uploadedSponsors: SponsorLogo[] = [];

    for (const file of validFiles) {
      const imageUrl = await uploadImage(file, "sponsors", MAX_LOGO_DIMENSION);
      if (!imageUrl) continue;

      const now = new Date().toISOString();
      uploadedSponsors.push({
        id: crypto.randomUUID(),
        name: getFileBaseName(file.name),
        logo_url: imageUrl,
        ordem: draft.sponsors.length + uploadedSponsors.length + 1,
        created_at: now,
        updated_at: now,
      });
    }

    if (uploadedSponsors.length === 0) {
      toast.dismiss("sponsors-upload");
      return;
    }

    const nextSettings = {
      ...draft,
      sponsors: [...draft.sponsors, ...uploadedSponsors],
    };

    setDraft(nextSettings);
    await persistSettings(nextSettings, { successMessage: "Patrocinadores adicionados.", silent: true });
    toast.success("Patrocinadores adicionados.", { id: "sponsors-upload" });
  }

  async function addTextSponsor() {
    const name = textSponsorForm.name.trim();

    if (!name) {
      toast.error("Preencha o nome ou texto do patrocinador.");
      return;
    }

    const now = new Date().toISOString();
    const nextSponsor: SponsorLogo = {
      id: crypto.randomUUID(),
      name,
      logo_url: "",
      display_type: "text",
      bg_color: textSponsorForm.bg_color,
      text_color: textSponsorForm.text_color,
      font_size: textSponsorForm.font_size,
      ordem: draft.sponsors.length + 1,
      created_at: now,
      updated_at: now,
    };

    const nextSettings = {
      ...draft,
      sponsors: [...draft.sponsors, nextSponsor],
    };

    setDraft(nextSettings);
    setTextSponsorForm(DEFAULT_TEXT_SPONSOR_FORM);
    await persistSettings(nextSettings, { successMessage: "Patrocinador de texto adicionado.", silent: true });
    toast.success("Patrocinador de texto adicionado.");
  }

  async function removeFrame() {
    const nextSettings = {
      ...draft,
      frame_url: "",
    };

    setDraft(nextSettings);
    await persistSettings(nextSettings, { successMessage: "Moldura removida." });
  }

  async function removeSponsor(id: string) {
    if (!window.confirm("Remover este patrocinador?")) return;

    const nextSettings = {
      ...draft,
      sponsors: draft.sponsors
        .filter((sponsor) => sponsor.id !== id)
        .map((sponsor, index) => ({ ...sponsor, ordem: index + 1 })),
    };

    setDraft(nextSettings);
    await persistSettings(nextSettings, { successMessage: "Patrocinador removido." });
  }

  async function changeSponsorOrder(id: string) {
    const sorted = sortedSponsors;
    const sponsor = sorted.find((item) => item.id === id);
    if (!sponsor) return;

    const max = sorted.length;
    const userInput = window.prompt(
      `Mover patrocinador "${sponsor.name}" para qual posição? (1-${max})`,
      String(sponsor.ordem),
    );

    if (!userInput) return;

    const nextPosition = Number(userInput.trim());
    if (!Number.isInteger(nextPosition) || nextPosition < 1 || nextPosition > max) {
      toast.error(`Digite um número entre 1 e ${max}.`);
      return;
    }

    const currentIndex = sorted.findIndex((item) => item.id === id);
    const targetIndex = nextPosition - 1;
    if (currentIndex === targetIndex) return;

    const reordered = [...sorted];
    const [movedSponsor] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, movedSponsor);

    const nextSettings = {
      ...draft,
      sponsors: reordered.map((item, index) => ({ ...item, ordem: index + 1 })),
    };

    setDraft(nextSettings);
    await persistSettings(nextSettings, { successMessage: "Ordem de patrocinadores atualizada.", silent: true });
    toast.success("Ordem de patrocinadores atualizada.");
  }

  async function saveDraft() {
    await persistSettings(draft, { successMessage: "Ajustes salvos." });
  }

  const hasActiveFrame = Boolean(draft.frame_url);

  if (authStatus === "checking") {
    return (
      <main className="anuncio-admin-login-shell">
        <div className="anuncio-admin-login-card">
          <div className="anuncio-admin-login-mark">
            <MonitorPlay size={24} />
          </div>
          <div className="admin-skeleton anuncio-admin-login-skeleton" />
          <div className="admin-skeleton anuncio-admin-login-line" />
        </div>
      </main>
    );
  }

  if (authStatus !== "authenticated") {
    return (
      <main className="anuncio-admin-login-shell">
        <form onSubmit={handleLogin} className="anuncio-admin-login-card">
          <div className="anuncio-admin-login-mark">
            <MonitorPlay size={24} />
          </div>
          <h1 className="anuncio-admin-login-title">Anúncios LED</h1>
          <p className="anuncio-admin-login-subtitle">Festa das Mães</p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="anuncio-admin-control"
            placeholder="Senha de acesso"
            required
          />
          <button type="submit" className="anuncio-admin-button anuncio-admin-button-primary">
            Entrar
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="anuncio-admin-shell">
      <header className="anuncio-admin-header">
        <div className="anuncio-admin-header-inner">
          <div className="anuncio-admin-brand">
            <div className="anuncio-admin-brand-icon">
              <MonitorPlay size={20} />
            </div>
            <div>
              <h1>Patrocinadores</h1>
              <p>
                {loading
                  ? "Sincronizando..."
                  : `${draft.sponsors.length} logos | telão 3x3 | ${draft.duration_seconds}s`}
              </p>
            </div>
          </div>

          <div className="anuncio-admin-header-actions">
            <a href="/anuncio" target="_blank" rel="noreferrer" className="anuncio-admin-button anuncio-admin-button-ghost">
              <ExternalLink size={16} />
              <span>Abrir telão</span>
            </a>
            <button
              type="button"
              onClick={saveDraft}
              disabled={isSaving || !isDirty}
              className="anuncio-admin-button anuncio-admin-button-primary"
            >
              <Save size={16} />
              <span>{isSaving ? "Salvando" : isDirty ? "Salvar ajustes" : "Salvo"}</span>
            </button>
            <button type="button" onClick={handleLogout} className="anuncio-admin-button anuncio-admin-button-ghost">
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="anuncio-admin-layout">
        <section className="anuncio-admin-main">
          <div className="anuncio-admin-grid">
            <AnuncioPanel title="Telão 3x3 e tempo" icon={SlidersHorizontal}>
              <div className="anuncio-admin-format-card">
                <div className="anuncio-admin-format-icon">
                  <Monitor size={18} />
                </div>
                <div>
                  <strong>Formato único 3x3</strong>
                  <span>Preview e exibição em área quadrada para LED.</span>
                </div>
              </div>
              <div className="anuncio-admin-controls-grid">
                <label className="anuncio-admin-field">
                  <AnuncioFieldLabel>Duração por logo</AnuncioFieldLabel>
                  <div className="anuncio-admin-input-with-unit">
                    <Clock3 size={15} />
                    <input
                      type="number"
                      min={2}
                      max={60}
                      value={draft.duration_seconds}
                      onChange={(event) => updateDraft({ duration_seconds: Number(event.target.value) })}
                      onBlur={() => void saveDraft().catch(() => undefined)}
                      className="anuncio-admin-control"
                    />
                    <span>s</span>
                  </div>
                </label>

                <label className="anuncio-admin-field">
                  <AnuncioFieldLabel>Transição</AnuncioFieldLabel>
                  <select
                    value={draft.transition_style}
                    onChange={(event) => {
                      const transitionStyle = event.target.value as AnuncioTransitionStyle;
                      const nextSettings = { ...draft, transition_style: transitionStyle };
                      setDraft(nextSettings);
                      void persistSettings(nextSettings, { successMessage: "Transição atualizada." }).catch(() => undefined);
                    }}
                    className="anuncio-admin-control"
                  >
                    {TRANSITION_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="anuncio-admin-field">
                  <AnuncioFieldLabel>Tempo da transição</AnuncioFieldLabel>
                  <div className="anuncio-admin-input-with-unit">
                    <input
                      type="number"
                      min={0}
                      max={2500}
                      step={50}
                      value={draft.transition_ms}
                      onChange={(event) => updateDraft({ transition_ms: Number(event.target.value) })}
                      onBlur={() => void saveDraft().catch(() => undefined)}
                      className="anuncio-admin-control"
                    />
                    <span>ms</span>
                  </div>
                </label>
              </div>
            </AnuncioPanel>

            <AnuncioPanel title="Moldura 3x3" icon={ImageIcon}>
              <div className="anuncio-admin-frame-item anuncio-admin-frame-item-square">
                <div className="anuncio-admin-frame-preview anuncio-admin-frame-preview-square">
                  {draft.frame_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={draft.frame_url} alt="Moldura 3x3" />
                  ) : (
                    <ImageIcon size={22} />
                  )}
                </div>
                <div className="anuncio-admin-frame-copy">
                  <strong>Moldura do telão</strong>
                  <span>{draft.frame_url ? "Moldura configurada" : "Sem moldura"}</span>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  ref={frameInputRef}
                  className="admin-hidden-input"
                  onChange={(event) => void handleFrameUpload(event).catch(() => undefined)}
                />
                <div className="anuncio-admin-frame-actions">
                  <button
                    type="button"
                    onClick={() => frameInputRef.current?.click()}
                    disabled={uploadingTarget === "frame-square"}
                    className="anuncio-admin-button anuncio-admin-button-ghost"
                  >
                    <UploadCloud size={15} />
                    <span>{draft.frame_url ? "Substituir" : "Enviar moldura"}</span>
                  </button>
                  {draft.frame_url && (
                    <button
                      type="button"
                      onClick={() => void removeFrame().catch(() => undefined)}
                      className="anuncio-admin-icon-button"
                      aria-label="Remover moldura"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </AnuncioPanel>
          </div>

          <AnuncioPanel title="Logos dos patrocinadores" icon={UploadCloud}>
            <div className="anuncio-admin-toolbar">
              <div>
                <strong>{draft.sponsors.length} patrocinadores</strong>
                <span>Arraste para definir a ordem do slideshow.</span>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                ref={sponsorInputRef}
                className="admin-hidden-input"
                onChange={(event) => void handleSponsorUpload(event).catch(() => undefined)}
              />
              <button
                type="button"
                onClick={() => sponsorInputRef.current?.click()}
                disabled={uploadingTarget === "sponsors"}
                className="anuncio-admin-button anuncio-admin-button-primary"
              >
                <Plus size={16} />
                <span>Adicionar logos</span>
              </button>
            </div>

            <div className="anuncio-admin-text-sponsor-card">
              <div className="anuncio-admin-text-sponsor-header">
                <div>
                  <strong>Adicionar patrocinador de texto</strong>
                  <span>Use texto, cores e tamanho para criar um bloco elegante.</span>
                </div>
              </div>
              <div className="anuncio-admin-text-sponsor-grid">
                <label className="anuncio-admin-field">
                  <AnuncioFieldLabel>Nome / texto</AnuncioFieldLabel>
                  <input
                    type="text"
                    value={textSponsorForm.name}
                    onChange={(event) => setTextSponsorForm((current) => ({ ...current, name: event.target.value }))}
                    className="anuncio-admin-control"
                    placeholder="FULANO DE TAL"
                  />
                </label>
                <label className="anuncio-admin-field">
                  <AnuncioFieldLabel>Cor de fundo</AnuncioFieldLabel>
                  <input
                    type="color"
                    value={textSponsorForm.bg_color}
                    onChange={(event) => setTextSponsorForm((current) => ({ ...current, bg_color: event.target.value }))}
                    className="anuncio-admin-color-input"
                  />
                </label>
                <label className="anuncio-admin-field">
                  <AnuncioFieldLabel>Cor do texto</AnuncioFieldLabel>
                  <input
                    type="color"
                    value={textSponsorForm.text_color}
                    onChange={(event) => setTextSponsorForm((current) => ({ ...current, text_color: event.target.value }))}
                    className="anuncio-admin-color-input"
                  />
                </label>
                <label className="anuncio-admin-field anuncio-admin-fontsize-field">
                  <AnuncioFieldLabel>Tamanho do texto ({textSponsorForm.font_size}px)</AnuncioFieldLabel>
                  <input
                    type="range"
                    min={24}
                    max={120}
                    step={2}
                    value={textSponsorForm.font_size}
                    onChange={(event) => setTextSponsorForm((current) => ({ ...current, font_size: Number(event.target.value) }))}
                    className="anuncio-admin-control"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={() => void addTextSponsor().catch(() => undefined)}
                className="anuncio-admin-button anuncio-admin-button-outline"
              >
                <Plus size={16} />
                <span>Adicionar como texto</span>
              </button>
            </div>

            <div className="anuncio-admin-sponsor-list">
              {sortedSponsors.length === 0 ? (
                <div className="anuncio-admin-empty-list">
                  <ImageIcon size={22} />
                  <span>Nenhum patrocinador cadastrado.</span>
                </div>
              ) : (
                sortedSponsors.map((sponsor, index) => (
                  <div
                    key={sponsor.id}
                    draggable
                    onDragStart={() => handleDragStart(index, sponsor.id)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(event) => event.preventDefault()}
                    className={`anuncio-admin-sponsor-row ${draggedId === sponsor.id ? "is-dragging" : ""}`}
                  >
                    <div className="anuncio-admin-drag-handle" aria-hidden="true">
                      <GripVertical size={17} />
                    </div>
                    <div className="anuncio-admin-sponsor-thumb">
                      {sponsor.display_type === "text" || !sponsor.logo_url ? (
                        <div
                          className="anuncio-admin-text-sponsor-preview"
                          style={{
                            backgroundColor: sponsor.bg_color || "#123a70",
                            color: sponsor.text_color || "#ffffff",
                            fontSize: sponsor.font_size ? `${sponsor.font_size}px` : "18px",
                          }}
                        >
                          {sponsor.name}
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={sponsor.logo_url} alt={sponsor.name} />
                      )}
                    </div>
                    <input
                      value={sponsor.name}
                      onChange={(event) => {
                        const nextSponsors = draft.sponsors.map((item) =>
                          item.id === sponsor.id ? { ...item, name: event.target.value } : item,
                        );
                        updateDraft({ sponsors: nextSponsors });
                      }}
                      onBlur={() => void saveDraft().catch(() => undefined)}
                      className="anuncio-admin-control anuncio-admin-sponsor-name"
                      aria-label="Nome do patrocinador"
                    />
                    <button
                      type="button"
                      onClick={() => void changeSponsorOrder(sponsor.id).catch(() => undefined)}
                      className="anuncio-admin-order-pill anuncio-admin-order-button"
                      aria-label={`Alterar ordem do patrocinador ${sponsor.name}`}
                    >
                      {index + 1}
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeSponsor(sponsor.id).catch(() => undefined)}
                      className="anuncio-admin-icon-button"
                      aria-label="Remover patrocinador"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </AnuncioPanel>
        </section>

        <aside className="anuncio-admin-preview-column">
          <AnuncioPanel title="Preview ao vivo" icon={MonitorPlay}>
            <div className="anuncio-admin-preview-meta">
              <span className={hasActiveFrame ? "is-ready" : ""}>
                {hasActiveFrame ? "Moldura ativa" : "Aguardando moldura"}
              </span>
              <span>3x3</span>
            </div>
            <div className="anuncio-admin-preview-shell">
              <AnuncioDisplay settings={draft} variant="preview" />
            </div>
          </AnuncioPanel>
        </aside>
      </div>
    </main>
  );
}
