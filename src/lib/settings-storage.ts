import type { SupabaseClient } from "@supabase/supabase-js";

export const SETTINGS_PATHS = {
  configOverrides: "config-overrides.json",
  announcements: "announcements.json",
} as const;

const SETTINGS_BUCKET = "tvpref-settings";

let ensureBucketPromise: Promise<void> | null = null;

export function serializeSupabaseError(error: unknown) {
  if (error instanceof Error) return error.message;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function isMissingRelationError(error: unknown) {
  const text = serializeSupabaseError(error);
  return (
    text.includes("PGRST205") ||
    text.includes("42P01") ||
    text.includes("Could not find the table") ||
    text.includes("does not exist")
  );
}

export function isMissingColumnError(error: unknown) {
  const text = serializeSupabaseError(error);
  return (
    text.includes("PGRST204") ||
    text.includes("42703") ||
    text.includes("Could not find the") ||
    text.includes("column") ||
    text.includes("schema cache")
  );
}

function isMissingStorageObject(error: unknown) {
  const text = serializeSupabaseError(error);
  return (
    text.includes("404") ||
    text.includes("not found") ||
    text.includes("Object not found") ||
    text.includes("No such object")
  );
}

function isExistingBucketError(error: unknown) {
  const text = serializeSupabaseError(error);
  return text.includes("already exists") || text.includes("Duplicate");
}

async function ensureSettingsBucket(supabaseAdmin: SupabaseClient) {
  if (!ensureBucketPromise) {
    ensureBucketPromise = (async () => {
      const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();

      if (listError) throw listError;
      if (buckets?.some((bucket) => bucket.name === SETTINGS_BUCKET)) return;

      const { error: createError } = await supabaseAdmin.storage.createBucket(SETTINGS_BUCKET, {
        public: false,
      });

      if (createError && !isExistingBucketError(createError)) {
        throw createError;
      }
    })();
  }

  return ensureBucketPromise;
}

export async function readSettingsJson<T>(
  supabaseAdmin: SupabaseClient,
  path: string,
  fallback: T,
) {
  await ensureSettingsBucket(supabaseAdmin);

  const { data, error } = await supabaseAdmin.storage.from(SETTINGS_BUCKET).download(path);

  if (error) {
    if (isMissingStorageObject(error)) return fallback;
    throw error;
  }

  try {
    return JSON.parse(await data.text()) as T;
  } catch {
    return fallback;
  }
}

export async function writeSettingsJson(
  supabaseAdmin: SupabaseClient,
  path: string,
  value: unknown,
) {
  await ensureSettingsBucket(supabaseAdmin);

  const { error } = await supabaseAdmin.storage.from(SETTINGS_BUCKET).upload(
    path,
    Buffer.from(JSON.stringify(value, null, 2), "utf-8"),
    {
      contentType: "application/json",
      upsert: true,
    },
  );

  if (error) throw error;
}

export async function touchConfigUpdatedAt(supabaseAdmin: SupabaseClient) {
  const { error } = await supabaseAdmin
    .from("configuracoes")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) {
    console.warn("Could not touch configuracoes.updated_at:", error);
  }
}
