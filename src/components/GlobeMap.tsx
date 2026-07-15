"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { MapMemory } from "@/types";
import { getAllMemories, saveMemoryWithBlobs, deleteMemory, getBlobUrl } from "@/lib/storage";
import { reverseGeocode } from "@/lib/geocode";
import MemoryModal from "./MemoryModal";
import { Heart, Plus, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <MapLoader />,
});

function MapLoader() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-surface rounded-2xl border border-border">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-text-muted text-sm">Loading map...</p>
      </div>
    </div>
  );
}

export default function GlobeMap() {
  const [memories, setMemories] = useState<MapMemory[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<MapMemory | null>(null);
  const [clickCoords, setClickCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [pickMode, setPickMode] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const loadMemories = useCallback(async () => {
    const data = await getAllMemories();
    setMemories(data);

    const urls: Record<string, string> = {};
    for (const m of data) {
      for (const id of m.imageIds) {
        const url = await getBlobUrl(id);
        if (url) urls[id] = url;
      }
    }
    setImageUrls(urls);
  }, []);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  const openAtCoords = async (coords: { lat: number; lng: number }) => {
    setClickCoords(coords);
    setSelectedMemory(null);
    setLocationName(null);
    setPickMode(false);
    setModalOpen(true);
    setGeocoding(true);
    const name = await reverseGeocode(coords.lat, coords.lng);
    setLocationName(name);
    setGeocoding(false);
  };

  const handleMapClick = (coords: { lat: number; lng: number }) => {
    if (pickMode) {
      openAtCoords(coords);
    }
  };

  const handleMarkerClick = (memory: MapMemory) => {
    setSelectedMemory(memory);
    setClickCoords(null);
    setLocationName(memory.locationName ?? null);
    setModalOpen(true);
  };

  const handleSave = async (data: {
    title: string;
    note: string;
    files: File[];
    existingImageIds: string[];
    locationName?: string;
  }) => {
    const now = new Date().toISOString();

    const base: MapMemory = selectedMemory
      ? {
          ...selectedMemory,
          title: data.title,
          note: data.note,
          locationName: data.locationName,
          imageIds: data.existingImageIds,
          updatedAt: now,
        }
      : {
          id: crypto.randomUUID(),
          lat: clickCoords!.lat,
          lng: clickCoords!.lng,
          title: data.title,
          note: data.note,
          locationName: data.locationName,
          imageIds: data.existingImageIds,
          createdAt: now,
          updatedAt: now,
        };

    if (selectedMemory || clickCoords) {
      await saveMemoryWithBlobs(base, data.files);
    }

    setModalOpen(false);
    setSelectedMemory(null);
    setClickCoords(null);
    setLocationName(null);
    await loadMemories();
  };

  const handleDelete = async () => {
    if (!selectedMemory) return;
    await deleteMemory(selectedMemory.id);
    setModalOpen(false);
    setSelectedMemory(null);
    await loadMemories();
  };

  return (
    <div className="relative w-full h-full min-h-[55vh] md:min-h-[68vh]">
      <MapView
        memories={memories}
        pickMode={pickMode}
        onMapClick={handleMapClick}
        onMarkerClick={handleMarkerClick}
      />

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="absolute bottom-20 left-4 right-16 md:top-16 md:bottom-auto md:left-auto md:right-4 md:w-72 pointer-events-none z-10"
      >
        <div className="bg-surface/90 backdrop-blur-md rounded-xl p-4 shadow-lg border border-border pointer-events-auto">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-accent fill-accent/30" />
            <span className="text-sm font-medium text-text">Our Memories</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Search any place, zoom in for street names & POIs. Tap <strong className="text-text">+</strong> then pick an exact spot.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-accent/10 text-accent px-2.5 py-0.5 rounded-full text-xs">
              <MapPin className="w-3 h-3" />
              {memories.length} {memories.length === 1 ? "place" : "places"}
            </span>
          </div>
        </div>
      </motion.div>

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setPickMode((p) => !p)}
        className={`absolute bottom-6 right-4 md:bottom-8 md:right-8 w-14 h-14 rounded-full shadow-lg transition-all flex items-center justify-center z-10 ${
          pickMode
            ? "bg-surface text-accent border-2 border-accent shadow-accent/20"
            : "bg-accent text-white hover:bg-accent/90 shadow-accent/30"
        }`}
        aria-label={pickMode ? "Cancel pin mode" : "Add memory"}
      >
        <Plus className={`w-6 h-6 transition-transform ${pickMode ? "rotate-45" : ""}`} />
      </motion.button>

      <MemoryModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedMemory(null);
          setClickCoords(null);
          setLocationName(null);
        }}
        memory={selectedMemory}
        coords={clickCoords}
        locationName={locationName}
        geocoding={geocoding}
        imageUrls={imageUrls}
        onSave={handleSave}
        onDelete={selectedMemory ? handleDelete : undefined}
      />
    </div>
  );
}
