"use client";

const ANUNCIO_SYNC_STORAGE_KEY = "tvpref-anuncio-data-sync";
const ANUNCIO_SYNC_EVENT = "tvpref-anuncio-data-sync";

export function notifyAnuncioDataChange() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(ANUNCIO_SYNC_STORAGE_KEY, String(Date.now()));
  } catch {
    // The in-tab event still keeps the current browser session synchronized.
  }

  window.dispatchEvent(new Event(ANUNCIO_SYNC_EVENT));
}

export function subscribeAnuncioDataChange(onChange: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (event.key === ANUNCIO_SYNC_STORAGE_KEY) onChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(ANUNCIO_SYNC_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(ANUNCIO_SYNC_EVENT, onChange);
  };
}
