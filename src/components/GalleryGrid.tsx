"use client";

import { useState, useEffect, useCallback } from "react";
import type { MediaItem } from "@/types";
import {
  getAllGallery,
  saveGalleryItem,
  deleteGalleryItem,
  saveBlob,
  getBlobUrl,
} from "@/lib/storage";
import Modal from "./Modal";
import { Plus, Trash2, Play, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

export default function GalleryGrid() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState<MediaItem | null>(null);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");

  const load = useCallback(async () => {
    const data = await getAllGallery();
    data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setItems(data);

    const u: Record<string, string> = {};
    for (const item of data) {
      const url = await getBlobUrl(item.blobId);
      if (url) u[item.blobId] = url;
    }
    setUrls(u);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (data: { title: string; caption: string; file: File }) => {
    const blobId = await saveBlob(data.file, "gallery");
    const item: MediaItem = {
      id: crypto.randomUUID(),
      type: data.file.type.startsWith("video/") ? "video" : "image",
      blobId,
      title: data.title,
      caption: data.caption,
      createdAt: new Date().toISOString(),
    };
    await saveGalleryItem(item);
    setModalOpen(false);
    await load();
  };

  const handleDelete = async (id: string) => {
    await deleteGalleryItem(id);
    setViewItem(null);
    await load();
  };

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-2">
          {(["all", "image", "video"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f ? "bg-accent/15 text-accent" : "text-text-muted hover:bg-primary/10"
              }`}
            >
              {f === "all" ? "All" : f === "image" ? "Photos" : "Videos"}
            </button>
          ))}
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-full text-sm hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nothing here yet. Add your first memory!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filtered.map((item, i) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setViewItem(item)}
              className="group relative aspect-square rounded-xl overflow-hidden bg-primary/5 border border-border hover:border-accent/30 transition-all"
            >
              {item.type === "video" ? (
                <>
                  <video
                    src={urls[item.blobId]}
                    className="w-full h-full object-cover"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-text/10 group-hover:bg-text/20 transition-colors">
                    <Play className="w-8 h-8 text-white drop-shadow" />
                  </div>
                </>
              ) : (
                <img
                  src={urls[item.blobId]}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
              {item.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-text/60 to-transparent p-3 pt-8">
                  <p className="text-white text-xs font-medium truncate">{item.title}</p>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      )}

      <AddMediaModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleAdd} />

      {viewItem && (
        <Modal open={!!viewItem} onClose={() => setViewItem(null)} title={viewItem.title} wide>
          <div className="space-y-4">
            {viewItem.type === "video" ? (
              <video
                src={urls[viewItem.blobId]}
                controls
                className="w-full rounded-xl max-h-[60vh]"
              />
            ) : (
              <img
                src={urls[viewItem.blobId]}
                alt={viewItem.title}
                className="w-full rounded-xl max-h-[60vh] object-contain"
              />
            )}
            {viewItem.caption && (
              <p className="text-sm text-text-muted leading-relaxed">{viewItem.caption}</p>
            )}
            <button
              onClick={() => handleDelete(viewItem.id)}
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AddMediaModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; caption: string; file: File }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setCaption("");
      setFile(null);
      setPreview(null);
    }
  }, [open]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setSaving(true);
    await onSave({ title, caption, file });
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Media">
      <form onSubmit={handleSubmit} className="space-y-4">
        {preview && (
          <div className="rounded-xl overflow-hidden max-h-48">
            {file?.type.startsWith("video/") ? (
              <video src={preview} className="w-full h-full object-cover" muted />
            ) : (
              <img src={preview} alt="" className="w-full h-full object-cover" />
            )}
          </div>
        )}
        <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent/40 transition-colors">
          <Plus className="w-4 h-4 text-text-muted" />
          <span className="text-sm text-text-muted">Choose photo or video</span>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFile}
            className="hidden"
            required
          />
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption (optional)"
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
        />
        <button
          type="submit"
          disabled={!file || saving}
          className="w-full py-2.5 rounded-xl bg-accent text-white text-sm hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </Modal>
  );
}
