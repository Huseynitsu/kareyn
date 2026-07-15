"use client";

import { useState } from "react";
import { Heart, Lock } from "lucide-react";

interface LoginGateProps {
  onLogin: (password: string) => Promise<boolean>;
}

export default function LoginGate({ onLogin }: LoginGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const ok = await onLogin(password);
    if (!ok) setError(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Heart className="w-10 h-10 text-accent fill-accent/30 mx-auto mb-4" />
          <h1 className="text-2xl font-serif text-text">Huseyn & Karla</h1>
          <p className="text-sm text-text-muted mt-2">Enter our password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Password"
              autoFocus
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-border text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">Wrong password. Try again.</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-xl bg-accent text-background font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Entering..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
