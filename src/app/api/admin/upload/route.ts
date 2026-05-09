import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const MAX_UPLOAD_BYTES = 250 * 1024 * 1024;
const MEDIA_BUCKET = "media";

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/ogg": "ogv",
  "video/webm": "webm",
};

function getSafeExtension(file: File) {
  const extensionFromType = EXTENSION_BY_TYPE[file.type];
  if (extensionFromType) return extensionFromType;

  const extensionFromName = file.name.split(".").pop()?.toLowerCase();
  if (extensionFromName && /^[a-z0-9]{2,5}$/.test(extensionFromName)) {
    return extensionFromName;
  }

  return "bin";
}

function isAllowedMedia(file: File) {
  return file.type.startsWith("image/") || ["video/mp4", "video/ogg", "video/webm"].includes(file.type);
}

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo é obrigatório" }, { status: 400 });
    }

    if (!isAllowedMedia(file)) {
      return NextResponse.json({ error: "Formato de mídia não permitido" }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Arquivo excede o limite de 250 MB" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const filePath = `uploads/${crypto.randomUUID()}.${getSafeExtension(file)}`;
    const { error } = await supabaseAdmin.storage.from(MEDIA_BUCKET).upload(filePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (error) throw error;

    const { data } = supabaseAdmin.storage.from(MEDIA_BUCKET).getPublicUrl(filePath);

    return NextResponse.json({ publicUrl: data.publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Erro no upload da mídia" }, { status: 500 });
  }
}
