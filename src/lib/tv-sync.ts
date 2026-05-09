"use client";

const TV_SYNC_STORAGE_KEY = "tvpref-tv-data-sync";
const TV_SYNC_EVENT = "tvpref-tv-data-sync";

export function notifyTvDataChange() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(TV_SYNC_STORAGE_KEY, String(Date.now()));
  } catch {
    // Local storage can be blocked in private contexts; the in-tab event still works.
  }

  window.dispatchEvent(new Event(TV_SYNC_EVENT));
}

export function subscribeTvDataChange(onChange: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (event.key === TV_SYNC_STORAGE_KEY) onChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(TV_SYNC_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(TV_SYNC_EVENT, onChange);
  };
}
