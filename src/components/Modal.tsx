"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  wide?: boolean;
}

export default function Modal({ open, onClose, title, children, wide }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className={`relative bg-surface rounded-t-2xl md:rounded-2xl shadow-xl border border-border w-full ${
              wide ? "md:max-w-2xl" : "md:max-w-lg"
            } max-h-[90vh] overflow-y-auto mx-0 md:mx-4`}
          >
            <div className="sticky top-0 bg-surface/95 backdrop-blur-sm flex items-center justify-between px-5 py-4 border-b border-border z-10">
              {title && <h2 className="text-lg font-serif text-text">{title}</h2>}
              <button
                onClick={onClose}
                className="ml-auto p-2 rounded-full hover:bg-surface-elevated text-text-muted hover:text-text transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
