"use client";

import { useState, useEffect, useCallback } from "react";
import type { MediaItem } from "@/types";
import { getAllEdits, saveEditItem, deleteEditItem, saveBlob, getBlobUrl } from "@/lib/storage";
import Modal from "./Modal";
import { Plus, Trash2, Play, Film, Scissors } from "lucide-react";
import { motion } from "framer-motion";

export default function EditsGrid() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState<MediaItem | null>(null);

  const load = useCallback(async () => {
    const data = await getAllEdits();
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
    const blobId = await saveBlob(data.file, "edits");
    const item: MediaItem = {
      id: crypto.randomUUID(),
      type: "video",
      blobId,
      title: data.title,
      caption: data.caption,
      createdAt: new Date().toISOString(),
    };
    await saveEditItem(item);
    setModalOpen(false);
    await load();
  };

  const handleDelete = async (id: string) => {
    await deleteEditItem(id);
    setViewItem(null);
    await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-text-muted">Video edits we made together</p>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-full text-sm hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Edit
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <Scissors className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No edits yet. Upload your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setViewItem(item)}
              className="group relative aspect-video rounded-xl overflow-hidden bg-primary/5 border border-border hover:border-accent/30 transition-all text-left"
            >
              <video src={urls[item.blobId]} className="w-full h-full object-cover" muted />
              <div className="absolute inset-0 flex items-center justify-center bg-text/10 group-hover:bg-text/20 transition-colors">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-6 h-6 text-white ml-0.5" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-text/70 to-transparent p-4 pt-10">
                <div className="flex items-center gap-2">
                  <Film className="w-3.5 h-3.5 text-white/70" />
                  <p className="text-white text-sm font-medium truncate">{item.title || "Untitled edit"}</p>
                </div>
                {item.caption && (
                  <p className="text-white/70 text-xs mt-1 truncate">{item.caption}</p>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <AddEditModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleAdd} />

      {viewItem && (
        <Modal open={!!viewItem} onClose={() => setViewItem(null)} title={viewItem.title || "Edit"} wide>
          <div className="space-y-4">
            <video src={urls[viewItem.blobId]} controls className="w-full rounded-xl" />
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

function AddEditModal({
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
    <Modal open={open} onClose={onClose} title="New Edit">
      <form onSubmit={handleSubmit} className="space-y-4">
        {preview && (
          <video src={preview} className="w-full rounded-xl max-h-48 object-cover" muted />
        )}
        <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent/40 transition-colors">
          <Plus className="w-4 h-4 text-text-muted" />
          <span className="text-sm text-text-muted">Choose video</span>
          <input type="file" accept="video/*" onChange={handleFile} className="hidden" required />
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Edit name"
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="About this edit..."
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
