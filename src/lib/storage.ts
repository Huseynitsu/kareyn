import type { MapMemory, MediaItem, TravelPlan } from "@/types";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

const MEDIA_BUCKET = "media";

export class AuthError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "AuthError";
  }
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const res = await fetch(path, {
    ...options,
    credentials: "same-origin",
    headers: isFormData
      ? options?.headers
      : { "Content-Type": "application/json", ...options?.headers },
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("kareyn-unauthorized"));
    }
    throw new AuthError();
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  return res.json();
}

export async function checkSession(): Promise<boolean> {
  try {
    const data = await api<{ authenticated: boolean }>("/api/auth");
    return data.authenticated;
  } catch {
    return false;
  }
}

export async function login(password: string): Promise<boolean> {
  try {
    await api("/api/auth", { method: "POST", body: JSON.stringify({ password }) });
    return true;
  } catch {
    return false;
  }
}

export async function logout(): Promise<void> {
  await api("/api/auth", { method: "DELETE" });
}

export async function saveBlob(file: File, folder = "misc"): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";

  let signData: { path: string; token: string };
  try {
    signData = await api<{ path: string; signedUrl: string; token: string }>(
      "/api/upload/sign",
      {
        method: "POST",
        body: JSON.stringify({ folder, contentType: file.type, ext }),
      }
    );
  } catch (err) {
    throw new Error(`Could not start upload: ${err instanceof Error ? err.message : "unknown error"}`);
  }

  const supabase = getSupabaseBrowser();
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .uploadToSignedUrl(signData.path, signData.token, file, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return signData.path;
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mimeType });
}

function blobFolder(
  blobId: string,
  data: {
    memories?: MapMemory[];
    gallery?: MediaItem[];
    edits?: MediaItem[];
    plans?: TravelPlan[];
  }
): string {
  if (data.edits?.some((e) => e.blobId === blobId)) return "edits";
  if (data.gallery?.some((g) => g.blobId === blobId)) return "gallery";
  if (data.memories?.some((m) => m.imageIds?.includes(blobId))) return "memories";
  if (data.plans?.some((p) => p.imageId === blobId)) return "plans";
  return "import";
}

export async function importAllData(
  json: string,
  onProgress?: (message: string) => void
): Promise<void> {
  const data = JSON.parse(json) as {
    memories?: MapMemory[];
    gallery?: MediaItem[];
    edits?: MediaItem[];
    plans?: TravelPlan[];
    blobs?: { id: string; mimeType: string; data: string }[];
  };

  const idMap: Record<string, string> = {};
  const blobs = data.blobs ?? [];

  onProgress?.("Importing map memories...");
  for (const m of data.memories ?? []) {
    await saveMemory({
      ...m,
      imageIds: (m.imageIds ?? []).map((id) => idMap[id] ?? id),
    });
  }

  onProgress?.("Importing plans...");
  for (const p of data.plans ?? []) {
    await savePlan({
      ...p,
      imageId: p.imageId ? idMap[p.imageId] ?? p.imageId : undefined,
    });
  }

  for (let i = 0; i < blobs.length; i++) {
    const b = blobs[i];
    onProgress?.(`Uploading media ${i + 1} of ${blobs.length}...`);
    try {
      const blob = base64ToBlob(b.data, b.mimeType);
      const file = new File([blob], b.id, { type: b.mimeType });
      const folder = blobFolder(b.id, data);
      idMap[b.id] = await saveBlob(file, folder);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown error";
      throw new Error(`Failed on file ${i + 1}/${blobs.length}: ${msg}`);
    }
  }

  onProgress?.("Importing gallery...");
  for (const g of data.gallery ?? []) {
    const blobId = idMap[g.blobId];
    if (!blobId) continue;
    await saveGalleryItem({ ...g, blobId });
  }

  onProgress?.("Importing edits...");
  for (const e of data.edits ?? []) {
    const blobId = idMap[e.blobId];
    if (!blobId) continue;
    await saveEditItem({ ...e, blobId });
  }

  onProgress?.("Done!");
}

export async function getBlobUrl(storagePath: string): Promise<string | null> {
  if (!storagePath) return null;
  if (storagePath.startsWith("http")) return storagePath;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/media/${storagePath}`;
}

export async function deleteBlob(path: string) {
  await api("/api/upload", { method: "DELETE", body: JSON.stringify({ path }) });
}

export async function getAllMemories(): Promise<MapMemory[]> {
  return api<MapMemory[]>("/api/memories");
}

export async function saveMemory(memory: MapMemory) {
  await api<MapMemory>("/api/memories", { method: "POST", body: JSON.stringify(memory) });
}

export async function saveMemoryWithBlobs(
  memory: MapMemory,
  newFiles: File[]
): Promise<MapMemory> {
  const imageIds = [...memory.imageIds];
  for (const file of newFiles) {
    const path = await saveBlob(file, "memories");
    imageIds.push(path);
  }
  const saved: MapMemory = {
    ...memory,
    imageIds,
    updatedAt: new Date().toISOString(),
  };
  return api<MapMemory>("/api/memories", { method: "POST", body: JSON.stringify(saved) });
}

export async function deleteMemory(id: string) {
  await api("/api/memories", { method: "DELETE", body: JSON.stringify({ id }) });
}

export async function getAllGallery(): Promise<MediaItem[]> {
  return api<MediaItem[]>("/api/gallery");
}

export async function saveGalleryItem(item: MediaItem) {
  await api("/api/gallery", { method: "POST", body: JSON.stringify(item) });
}

export async function deleteGalleryItem(id: string) {
  await api("/api/gallery", { method: "DELETE", body: JSON.stringify({ id }) });
}

export async function getAllEdits(): Promise<MediaItem[]> {
  return api<MediaItem[]>("/api/edits");
}

export async function saveEditItem(item: MediaItem) {
  await api("/api/edits", { method: "POST", body: JSON.stringify(item) });
}

export async function deleteEditItem(id: string) {
  await api("/api/edits", { method: "DELETE", body: JSON.stringify({ id }) });
}

export async function getAllPlans(): Promise<TravelPlan[]> {
  return api<TravelPlan[]>("/api/plans");
}

export async function savePlan(plan: TravelPlan) {
  await api("/api/plans", { method: "POST", body: JSON.stringify(plan) });
}

export async function deletePlan(id: string) {
  await api("/api/plans", { method: "DELETE", body: JSON.stringify({ id }) });
}

export async function exportAllData(): Promise<string> {
  const [memories, gallery, edits, plans] = await Promise.all([
    getAllMemories(),
    getAllGallery(),
    getAllEdits(),
    getAllPlans(),
  ]);
  return JSON.stringify({ memories, gallery, edits, plans }, null, 2);
}
