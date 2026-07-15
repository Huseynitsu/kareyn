export interface MapMemory {
  id: string;
  lat: number;
  lng: number;
  title: string;
  note: string;
  locationName?: string;
  imageIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  type: "image" | "video";
  blobId: string;
  title: string;
  caption: string;
  createdAt: string;
}

export interface TravelPlan {
  id: string;
  title: string;
  destination: string;
  date: string;
  description: string;
  activities: string[];
  status: "planned" | "completed" | "dream";
  imageId?: string;
  createdAt: string;
}

export interface StoredBlob {
  id: string;
  blob: Blob;
  mimeType: string;
}
