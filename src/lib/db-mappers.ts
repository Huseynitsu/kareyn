import type { MapMemory, MediaItem, TravelPlan } from "@/types";

export interface MemoryRow {
  id: string;
  lat: number;
  lng: number;
  title: string;
  note: string;
  location_name: string | null;
  image_paths: string[];
  created_at: string;
  updated_at: string;
}

export interface MediaRow {
  id: string;
  type: string;
  storage_path: string;
  title: string;
  caption: string;
  created_at: string;
}

export interface PlanRow {
  id: string;
  title: string;
  destination: string;
  date: string | null;
  description: string;
  activities: string[];
  status: string;
  image_path: string | null;
  created_at: string;
}

export function rowToMemory(row: MemoryRow): MapMemory {
  return {
    id: row.id,
    lat: row.lat,
    lng: row.lng,
    title: row.title,
    note: row.note,
    locationName: row.location_name ?? undefined,
    imageIds: row.image_paths ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function memoryToRow(memory: MapMemory): Omit<MemoryRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
} {
  return {
    id: memory.id,
    lat: memory.lat,
    lng: memory.lng,
    title: memory.title,
    note: memory.note,
    location_name: memory.locationName ?? null,
    image_paths: memory.imageIds,
    updated_at: memory.updatedAt,
    created_at: memory.createdAt,
  };
}

export function rowToMediaItem(row: MediaRow): MediaItem {
  return {
    id: row.id,
    type: row.type as "image" | "video",
    blobId: row.storage_path,
    title: row.title,
    caption: row.caption,
    createdAt: row.created_at,
  };
}

export function rowToPlan(row: PlanRow): TravelPlan {
  return {
    id: row.id,
    title: row.title,
    destination: row.destination,
    date: row.date ?? "",
    description: row.description,
    activities: Array.isArray(row.activities) ? row.activities : [],
    status: row.status as TravelPlan["status"],
    imageId: row.image_path ?? undefined,
    createdAt: row.created_at,
  };
}

export function planToRow(plan: TravelPlan) {
  return {
    id: plan.id,
    title: plan.title,
    destination: plan.destination,
    date: plan.date || null,
    description: plan.description,
    activities: plan.activities,
    status: plan.status,
    image_path: plan.imageId ?? null,
    created_at: plan.createdAt,
  };
}
