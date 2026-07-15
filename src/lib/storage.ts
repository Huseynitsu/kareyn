import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { MapMemory, MediaItem, TravelPlan, StoredBlob } from "@/types";

interface KareynDB extends DBSchema {
  memories: { key: string; value: MapMemory };
  gallery: { key: string; value: MediaItem };
  edits: { key: string; value: MediaItem };
  plans: { key: string; value: TravelPlan };
  blobs: { key: string; value: StoredBlob };
}

const DB_NAME = "kareyn-db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<KareynDB>> | null = null;
let writeQueue: Promise<unknown> = Promise.resolve();

function isClosingError(err: unknown): boolean {
  if (!(err instanceof DOMException)) return false;
  return (
    err.name === "InvalidStateError" ||
    err.message.includes("closing") ||
    err.message.includes("closed")
  );
}

function resetDB() {
  dbPromise = null;
}

function attachLifecycle(db: IDBPDatabase<KareynDB>) {
  db.onclose = () => resetDB();
  db.onversionchange = () => {
    db.close();
    resetDB();
  };
}

async function openDatabase(): Promise<IDBPDatabase<KareynDB>> {
  const db = await openDB<KareynDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("memories")) db.createObjectStore("memories", { keyPath: "id" });
      if (!db.objectStoreNames.contains("gallery")) db.createObjectStore("gallery", { keyPath: "id" });
      if (!db.objectStoreNames.contains("edits")) db.createObjectStore("edits", { keyPath: "id" });
      if (!db.objectStoreNames.contains("plans")) db.createObjectStore("plans", { keyPath: "id" });
      if (!db.objectStoreNames.contains("blobs")) db.createObjectStore("blobs", { keyPath: "id" });
    },
    blocked() {
      console.warn("[kareyn-db] Database upgrade blocked — close other tabs using this site.");
    },
  });
  attachLifecycle(db);
  return db;
}

async function getDB(): Promise<IDBPDatabase<KareynDB>> {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser");
  }

  if (dbPromise) {
    try {
      const db = await dbPromise;
      return db;
    } catch {
      resetDB();
    }
  }

  dbPromise = openDatabase();
  return dbPromise;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isClosingError(err) || attempt === retries) throw err;
      resetDB();
      await new Promise((r) => setTimeout(r, 50 * (attempt + 1)));
    }
  }
  throw lastError;
}

function enqueueWrite<T>(fn: () => Promise<T>): Promise<T> {
  const task = writeQueue.then(() => withRetry(fn));
  writeQueue = task.then(
    () => undefined,
    () => undefined
  );
  return task;
}

export async function saveBlob(file: File): Promise<string> {
  return enqueueWrite(async () => {
    const db = await getDB();
    const id = crypto.randomUUID();
    await db.put("blobs", { id, blob: file, mimeType: file.type });
    return id;
  });
}

export async function getBlobUrl(id: string): Promise<string | null> {
  return withRetry(async () => {
    const db = await getDB();
    const stored = await db.get("blobs", id);
    if (!stored) return null;
    return URL.createObjectURL(stored.blob);
  });
}

export async function deleteBlob(id: string) {
  return enqueueWrite(async () => {
    const db = await getDB();
    await db.delete("blobs", id);
  });
}

export async function getAllMemories(): Promise<MapMemory[]> {
  return withRetry(async () => {
    const db = await getDB();
    return db.getAll("memories");
  });
}

export async function saveMemory(memory: MapMemory) {
  return enqueueWrite(async () => {
    const db = await getDB();
    await db.put("memories", memory);
  });
}

/** Save blobs + memory atomically in one write queue task */
export async function saveMemoryWithBlobs(
  memory: MapMemory,
  newFiles: File[]
): Promise<MapMemory> {
  return enqueueWrite(async () => {
    const db = await getDB();
    const imageIds = [...memory.imageIds];

    for (const file of newFiles) {
      const id = crypto.randomUUID();
      await db.put("blobs", { id, blob: file, mimeType: file.type });
      imageIds.push(id);
    }

    const saved: MapMemory = { ...memory, imageIds };
    await db.put("memories", saved);
    return saved;
  });
}

export async function deleteMemory(id: string) {
  return enqueueWrite(async () => {
    const db = await getDB();
    const memory = await db.get("memories", id);
    if (!memory) return;

    for (const blobId of memory.imageIds) {
      await db.delete("blobs", blobId);
    }
    await db.delete("memories", id);
  });
}

export async function getAllGallery(): Promise<MediaItem[]> {
  return withRetry(async () => {
    const db = await getDB();
    return db.getAll("gallery");
  });
}

export async function saveGalleryItem(item: MediaItem) {
  return enqueueWrite(async () => {
    const db = await getDB();
    await db.put("gallery", item);
  });
}

export async function deleteGalleryItem(id: string) {
  return enqueueWrite(async () => {
    const db = await getDB();
    const item = await db.get("gallery", id);
    if (!item) return;
    await db.delete("blobs", item.blobId);
    await db.delete("gallery", id);
  });
}

export async function getAllEdits(): Promise<MediaItem[]> {
  return withRetry(async () => {
    const db = await getDB();
    return db.getAll("edits");
  });
}

export async function saveEditItem(item: MediaItem) {
  return enqueueWrite(async () => {
    const db = await getDB();
    await db.put("edits", item);
  });
}

export async function deleteEditItem(id: string) {
  return enqueueWrite(async () => {
    const db = await getDB();
    const item = await db.get("edits", id);
    if (!item) return;
    await db.delete("blobs", item.blobId);
    await db.delete("edits", id);
  });
}

export async function getAllPlans(): Promise<TravelPlan[]> {
  return withRetry(async () => {
    const db = await getDB();
    return db.getAll("plans");
  });
}

export async function savePlan(plan: TravelPlan) {
  return enqueueWrite(async () => {
    const db = await getDB();
    await db.put("plans", plan);
  });
}

export async function deletePlan(id: string) {
  return enqueueWrite(async () => {
    const db = await getDB();
    const plan = await db.get("plans", id);
    if (plan?.imageId) await db.delete("blobs", plan.imageId);
    await db.delete("plans", id);
  });
}

export async function exportAllData(): Promise<string> {
  return withRetry(async () => {
    const db = await getDB();
    const memories = await db.getAll("memories");
    const gallery = await db.getAll("gallery");
    const edits = await db.getAll("edits");
    const plans = await db.getAll("plans");
    const blobs = await db.getAll("blobs");

    const blobData = await Promise.all(
      blobs.map(async (b) => ({
        id: b.id,
        mimeType: b.mimeType,
        data: await blobToBase64(b.blob),
      }))
    );

    return JSON.stringify({ memories, gallery, edits, plans, blobs: blobData }, null, 2);
  });
}

export async function importAllData(json: string) {
  return enqueueWrite(async () => {
    const data = JSON.parse(json);
    const db = await getDB();

    await db.clear("memories");
    await db.clear("gallery");
    await db.clear("edits");
    await db.clear("plans");
    await db.clear("blobs");

    for (const b of data.blobs ?? []) {
      const blob = base64ToBlob(b.data, b.mimeType);
      await db.put("blobs", { id: b.id, blob, mimeType: b.mimeType });
    }
    for (const m of data.memories ?? []) await db.put("memories", m);
    for (const g of data.gallery ?? []) await db.put("gallery", g);
    for (const e of data.edits ?? []) await db.put("edits", e);
    for (const p of data.plans ?? []) await db.put("plans", p);
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mimeType });
}
