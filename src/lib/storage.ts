import type { MapMemory, MediaItem, TravelPlan } from "@/types";
import {
  getSupabaseBrowser,
  getMediaPublicUrl,
  buildStoragePath,
  mimeToExt,
  normalizeStoragePath,
  isStoragePath,
  MEDIA_BUCKET,
} from "@/lib/supabase/browser";
import { formatSupabaseError } from "@/lib/supabase/url";
import {
  rowToMemory,
  memoryToRow,
  rowToMediaItem,
  rowToPlan,
  planToRow,
  type MemoryRow,
  type MediaRow,
  type PlanRow,
} from "@/lib/db-mappers";

export class AuthError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "AuthError";
  }
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...options?.headers },
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

function supabase() {
  return getSupabaseBrowser();
}

function throwDbError(error: { message?: string; code?: string }, step: string): never {
  throw new Error(formatSupabaseError(error, step));
}

async function verifySupabaseSetup() {
  const { error } = await supabase().from("memories").select("id").limit(1);
  if (error) throwDbError(error, "Supabase connection check");
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
  const path = buildStoragePath(folder, file.type || "application/octet-stream");

  const { error } = await supabase()
    .storage.from(MEDIA_BUCKET)
    .upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed (${path}): ${error.message}`);
  }

  return path;
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
  onProgress?.("Checking Supabase connection...");
  await verifySupabaseSetup();

  const data = JSON.parse(json) as {
    memories?: MapMemory[];
    gallery?: MediaItem[];
    edits?: MediaItem[];
    plans?: TravelPlan[];
    blobs?: { id: string; mimeType: string; data: string }[];
  };

  const idMap: Record<string, string> = {};
  const blobs = data.blobs ?? [];

  for (let i = 0; i < blobs.length; i++) {
    const b = blobs[i];
    onProgress?.(`Uploading media ${i + 1} of ${blobs.length}...`);
    try {
      const blob = base64ToBlob(b.data, b.mimeType);
      const file = new File([blob], `file.${mimeToExt(b.mimeType)}`, { type: b.mimeType });
      idMap[b.id] = await saveBlob(file, blobFolder(b.id, data));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown error";
      throw new Error(`Failed on file ${i + 1}/${blobs.length}: ${msg}`);
    }
  }

  onProgress?.("Importing map memories...");
  for (const m of data.memories ?? []) {
    await saveMemory({
      ...m,
      imageIds: (m.imageIds ?? []).map((id) => idMap[id] ?? id).filter(isStoragePath),
    });
  }

  onProgress?.("Importing plans...");
  for (const p of data.plans ?? []) {
    const imageId = p.imageId ? idMap[p.imageId] ?? p.imageId : undefined;
    await savePlan({
      ...p,
      imageId: imageId && isStoragePath(imageId) ? imageId : undefined,
    });
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
  return getMediaPublicUrl(storagePath);
}

export async function deleteBlob(path: string) {
  const normalized = normalizeStoragePath(path);
  if (!isStoragePath(normalized)) return;

  const { error } = await supabase().storage.from(MEDIA_BUCKET).remove([normalized]);
  if (error) throw new Error(error.message);
}

export async function getAllMemories(): Promise<MapMemory[]> {
  const { data, error } = await supabase()
    .from("memories")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as MemoryRow[]).map(rowToMemory);
}

export async function saveMemory(memory: MapMemory) {
  const { error } = await supabase().from("memories").upsert(memoryToRow(memory));
  if (error) throwDbError(error, "Saving memory");
}

export async function saveMemoryWithBlobs(
  memory: MapMemory,
  newFiles: File[]
): Promise<MapMemory> {
  const imageIds = [...memory.imageIds];
  for (const file of newFiles) {
    imageIds.push(await saveBlob(file, "memories"));
  }
  const saved: MapMemory = {
    ...memory,
    imageIds,
    updatedAt: new Date().toISOString(),
  };
  await saveMemory(saved);
  return saved;
}

export async function deleteMemory(id: string) {
  const { data: memory } = await supabase()
    .from("memories")
    .select("image_paths")
    .eq("id", id)
    .single();

  if (memory?.image_paths?.length) {
    const paths = memory.image_paths.map(normalizeStoragePath).filter(isStoragePath);
    if (paths.length) {
      await supabase().storage.from(MEDIA_BUCKET).remove(paths);
    }
  }

  const { error } = await supabase().from("memories").delete().eq("id", id);
  if (error) throwDbError(error, "Deleting memory");
}

export async function getAllGallery(): Promise<MediaItem[]> {
  const { data, error } = await supabase()
    .from("gallery_items")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throwDbError(error, "Loading gallery");
  return ((data ?? []) as MediaRow[]).map(rowToMediaItem);
}

export async function saveGalleryItem(item: MediaItem) {
  const { error } = await supabase().from("gallery_items").upsert({
    id: item.id,
    type: item.type,
    storage_path: item.blobId,
    title: item.title,
    caption: item.caption,
    created_at: item.createdAt,
  });
  if (error) throwDbError(error, "Saving gallery item");
}

export async function deleteGalleryItem(id: string) {
  const { data: item } = await supabase()
    .from("gallery_items")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (item?.storage_path && isStoragePath(item.storage_path)) {
    await supabase().storage.from(MEDIA_BUCKET).remove([normalizeStoragePath(item.storage_path)]);
  }

  const { error } = await supabase().from("gallery_items").delete().eq("id", id);
  if (error) throwDbError(error, "Deleting gallery item");
}

export async function getAllEdits(): Promise<MediaItem[]> {
  const { data, error } = await supabase()
    .from("edit_items")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as MediaRow[]).map(rowToMediaItem);
}

export async function saveEditItem(item: MediaItem) {
  const { error } = await supabase().from("edit_items").upsert({
    id: item.id,
    type: item.type,
    storage_path: item.blobId,
    title: item.title,
    caption: item.caption,
    created_at: item.createdAt,
  });
  if (error) throwDbError(error, "Saving edit item");
}

export async function deleteEditItem(id: string) {
  const { data: item } = await supabase()
    .from("edit_items")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (item?.storage_path && isStoragePath(item.storage_path)) {
    await supabase().storage.from(MEDIA_BUCKET).remove([normalizeStoragePath(item.storage_path)]);
  }

  const { error } = await supabase().from("edit_items").delete().eq("id", id);
  if (error) throwDbError(error, "Deleting edit item");
}

export async function getAllPlans(): Promise<TravelPlan[]> {
  const { data, error } = await supabase()
    .from("travel_plans")
    .select("*")
    .order("date", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as PlanRow[]).map(rowToPlan);
}

export async function savePlan(plan: TravelPlan) {
  const { error } = await supabase().from("travel_plans").upsert(planToRow(plan));
  if (error) throwDbError(error, "Saving plan");
}

export async function deletePlan(id: string) {
  const { data: plan } = await supabase()
    .from("travel_plans")
    .select("image_path")
    .eq("id", id)
    .single();

  if (plan?.image_path && isStoragePath(plan.image_path)) {
    await supabase().storage.from(MEDIA_BUCKET).remove([normalizeStoragePath(plan.image_path)]);
  }

  const { error } = await supabase().from("travel_plans").delete().eq("id", id);
  if (error) throwDbError(error, "Deleting plan");
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
