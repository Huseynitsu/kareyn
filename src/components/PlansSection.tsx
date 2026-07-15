"use client";

import { useState, useEffect, useCallback } from "react";
import type { TravelPlan } from "@/types";
import { getAllPlans, savePlan, deletePlan, saveBlob, getBlobUrl } from "@/lib/storage";
import Modal from "./Modal";
import { Plus, Trash2, MapPin, Calendar, Sparkles, Check, Plane } from "lucide-react";
import { motion } from "framer-motion";

const statusConfig = {
  dream: { label: "Dream", icon: Sparkles, color: "text-purple-400 bg-purple-400/10" },
  planned: { label: "Planned", icon: Plane, color: "text-accent bg-accent/10" },
  completed: { label: "Done", icon: Check, color: "text-sage bg-sage/10" },
};

export default function PlansSection() {
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<TravelPlan | null>(null);
  const [filter, setFilter] = useState<"all" | TravelPlan["status"]>("all");

  const load = useCallback(async () => {
    const data = await getAllPlans();
    data.sort((a, b) => new Date(a.date || "9999").getTime() - new Date(b.date || "9999").getTime());
    setPlans(data);

    const urls: Record<string, string> = {};
    for (const p of data) {
      if (p.imageId) {
        const url = await getBlobUrl(p.imageId);
        if (url) urls[p.imageId] = url;
      }
    }
    setImageUrls(urls);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (plan: TravelPlan) => {
    await savePlan(plan);
    setModalOpen(false);
    setEditPlan(null);
    await load();
  };

  const handleDelete = async (id: string) => {
    await deletePlan(id);
    setEditPlan(null);
    setModalOpen(false);
    await load();
  };

  const filtered = filter === "all" ? plans : plans.filter((p) => p.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === "all" ? "bg-accent/15 text-accent" : "text-text-muted hover:bg-primary/10"
            }`}
          >
            All
          </button>
          {(["dream", "planned", "completed"] as const).map((s) => {
            const cfg = statusConfig[s];
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filter === s ? "bg-accent/15 text-accent" : "text-text-muted hover:bg-primary/10"
                }`}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => {
            setEditPlan(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-full text-sm hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Plan
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Future travel plans will live here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((plan, i) => {
            const cfg = statusConfig[plan.status];
            const StatusIcon = cfg.icon;
            return (
              <motion.button
                key={plan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  setEditPlan(plan);
                  setModalOpen(true);
                }}
                className="text-left bg-surface rounded-2xl border border-border hover:border-accent/30 overflow-hidden transition-all group"
              >
                {plan.imageId && imageUrls[plan.imageId] && (
                  <div className="h-40 overflow-hidden">
                    <img
                      src={imageUrls[plan.imageId]}
                      alt={plan.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-serif text-lg text-text">{plan.title}</h3>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${cfg.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {plan.destination}
                    </span>
                    {plan.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(plan.date).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-sm text-text-muted line-clamp-2 mb-3">{plan.description}</p>
                  )}
                  {plan.activities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {plan.activities.slice(0, 4).map((a, j) => (
                        <span key={j} className="text-[10px] px-2 py-0.5 bg-primary/10 text-text-muted rounded-full">
                          {a}
                        </span>
                      ))}
                      {plan.activities.length > 4 && (
                        <span className="text-[10px] px-2 py-0.5 text-text-muted">
                          +{plan.activities.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <PlanModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditPlan(null);
        }}
        plan={editPlan}
        imageUrl={editPlan?.imageId ? imageUrls[editPlan.imageId] : undefined}
        onSave={handleSave}
        onDelete={editPlan ? () => handleDelete(editPlan.id) : undefined}
      />
    </div>
  );
}

function PlanModal({
  open,
  onClose,
  plan,
  imageUrl,
  onSave,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  plan: TravelPlan | null;
  imageUrl?: string;
  onSave: (plan: TravelPlan) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [activities, setActivities] = useState("");
  const [status, setStatus] = useState<TravelPlan["status"]>("dream");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [existingImageId, setExistingImageId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(plan?.title ?? "");
      setDestination(plan?.destination ?? "");
      setDate(plan?.date ?? "");
      setDescription(plan?.description ?? "");
      setActivities(plan?.activities?.join(", ") ?? "");
      setStatus(plan?.status ?? "dream");
      setFile(null);
      setPreview(imageUrl ?? null);
      setExistingImageId(plan?.imageId);
    }
  }, [open, plan, imageUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let imageId = existingImageId;
    if (file) {
      imageId = await saveBlob(file, "plans");
    }

    const now = new Date().toISOString();
    const saved: TravelPlan = {
      id: plan?.id ?? crypto.randomUUID(),
      title,
      destination,
      date,
      description,
      activities: activities
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      status,
      imageId,
      createdAt: plan?.createdAt ?? now,
    };

    await onSave(saved);
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={plan ? "Edit Plan" : "New Plan"} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        {(preview || imageUrl) && (
          <div className="rounded-xl overflow-hidden max-h-40">
            <img src={preview ?? imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent/40 transition-colors">
          <Plus className="w-4 h-4 text-text-muted" />
          <span className="text-sm text-text-muted">Add cover photo</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setFile(f);
                setPreview(URL.createObjectURL(f));
              }
            }}
            className="hidden"
          />
        </label>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Plan name"
          required
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Destination (e.g. Paris, France)"
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <div className="flex gap-2">
          {(["dream", "planned", "completed"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
                status === s ? "bg-accent/15 text-accent" : "bg-primary/5 text-text-muted"
              }`}
            >
              {statusConfig[s].label}
            </button>
          ))}
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="About this trip..."
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
        />
        <input
          type="text"
          value={activities}
          onChange={(e) => setActivities(e.target.value)}
          placeholder="Activities (comma-separated: walk, restaurant, museum...)"
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
        />

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
