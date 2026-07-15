"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import type { MapMemory } from "@/types";
import { Camera, Trash2, MapPin, Loader2 } from "lucide-react";

interface MemoryModalProps {
  open: boolean;
  onClose: () => void;
  memory: MapMemory | null;
  coords: { lat: number; lng: number } | null;
  locationName: string | null;
  geocoding?: boolean;
  imageUrls: Record<string, string>;
  onSave: (data: {
    title: string;
    note: string;
    files: File[];
    existingImageIds: string[];
    locationName?: string;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export default function MemoryModal({
  open,
  onClose,
  memory,
  coords,
  locationName,
  geocoding,
  imageUrls,
  onSave,
  onDelete,
}: MemoryModalProps) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingIds, setExistingIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(memory?.title ?? "");
      setNote(memory?.note ?? "");
      setFiles([]);
      setPreviews([]);
      setExistingIds(memory?.imageIds ?? []);
    }
  }, [open, memory]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...selected]);
    selected.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => setPreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeExisting = (id: string) => {
    setExistingIds((prev) => prev.filter((i) => i !== id));
  };

  const removeNew = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      title,
      note,
      files,
      existingImageIds: existingIds,
      locationName: locationName ?? memory?.locationName,
    });
    setSaving(false);
  };

  const displayLocation = locationName ?? memory?.locationName;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={memory ? memory.title || "Memory" : "New Memory"}
      wide
    >
      {(coords || displayLocation) && (
        <div className="mb-4 bg-surface-elevated border border-border rounded-xl px-3 py-2.5 space-y-1">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
            {coords && (
              <span className="font-mono">
                {coords.lat.toFixed(6)}°, {coords.lng.toFixed(6)}°
              </span>
            )}
          </div>
          {geocoding ? (
            <div className="flex items-center gap-2 text-xs text-text-muted pl-5">
              <Loader2 className="w-3 h-3 animate-spin" />
              Finding location...
            </div>
          ) : displayLocation ? (
            <p className="text-xs text-text pl-5 leading-relaxed line-clamp-2">{displayLocation}</p>
          ) : null}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-text-muted mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="This place means..."
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-shadow"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-text-muted mb-1.5">Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What happened here, how it felt..."
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-shadow resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-text-muted mb-2">Photos</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {existingIds.map((id) =>
              imageUrls[id] ? (
                <div key={id} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                  <img src={imageUrls[id]} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExisting(id)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : null
            )}
            {previews.map((src, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNew(i)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
          <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent/40 hover:bg-accent/5 transition-colors">
            <Camera className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-muted">Add photos</span>
            <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-400/10 transition-colors"
            >
              Delete
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm text-text-muted hover:bg-surface-elevated transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="px-6 py-2.5 rounded-xl text-sm bg-accent text-background font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
