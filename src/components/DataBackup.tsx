"use client";

import { useRef } from "react";
import { exportAllData, importAllData } from "@/lib/storage";
import { Download, Upload } from "lucide-react";

export default function DataBackup() {
  const fileRef = useRef<HTMLInputElement>(null);

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
    const text = await file.text();
    if (confirm("This will replace all existing data. Continue?")) {
      await importAllData(text);
      window.location.reload();
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-muted hover:text-text hover:bg-primary/10 rounded-lg transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        Backup
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-muted hover:text-text hover:bg-primary/10 rounded-lg transition-colors"
      >
        <Upload className="w-3.5 h-3.5" />
        Restore
      </button>
      <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
    </div>
  );
}
