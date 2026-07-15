"use client";

import { useRef, useState } from "react";
import { exportAllData, importAllData } from "@/lib/storage";
import { Download, Upload, Loader2 } from "lucide-react";

export default function DataBackup() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState("");

  const handleExport = async () => {
    const json = await exportAllData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kareyn-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !confirm(
        "Import backup into cloud? Existing items with the same IDs will be updated. Large files may take several minutes."
      )
    ) {
      e.target.value = "";
      return;
    }

    setImporting(true);
    setProgress("Reading backup file...");

    try {
      const text = await file.text();
      await importAllData(text, setProgress);
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Import failed");
      setImporting(false);
      setProgress("");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={handleExport}
        disabled={importing}
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-muted hover:text-text hover:bg-surface-elevated rounded-lg transition-colors disabled:opacity-50"
      >
        <Download className="w-3.5 h-3.5" />
        Export
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        disabled={importing}
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-muted hover:text-text hover:bg-surface-elevated rounded-lg transition-colors disabled:opacity-50"
      >
        {importing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Upload className="w-3.5 h-3.5" />
        )}
        {importing ? "Importing..." : "Import backup"}
      </button>
      {progress && (
        <span className="text-[10px] text-text-muted max-w-[200px] truncate">{progress}</span>
      )}
      <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
    </div>
  );
}
