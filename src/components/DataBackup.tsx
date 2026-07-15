"use client";

import { useRef } from "react";
import { exportAllData } from "@/lib/storage";
import { Download } from "lucide-react";

export default function DataBackup() {
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

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-muted hover:text-text hover:bg-surface-elevated rounded-lg transition-colors"
    >
      <Download className="w-3.5 h-3.5" />
      Export backup
    </button>
  );
}
