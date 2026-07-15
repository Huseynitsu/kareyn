import type { MapMemory, MediaItem, TravelPlan } from "@/types";

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
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  const { path } = await api<{ path: string; url: string }>("/api/upload", {
    method: "POST",
    body: formData,
  });
  return path;
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

export async function importAllData(_json: string) {
  throw new Error("Import is disabled in cloud mode. Data syncs automatically.");
}
