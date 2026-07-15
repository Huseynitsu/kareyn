"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { checkSession, login as apiLogin, logout as apiLogout } from "@/lib/storage";
import LoginGate from "./LoginGate";

interface AuthContextValue {
  authenticated: boolean;
  loading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const ok = await checkSession();
    setAuthenticated(ok);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const onUnauthorized = () => {
      setAuthenticated(false);
    };
    window.addEventListener("kareyn-unauthorized", onUnauthorized);
    return () => window.removeEventListener("kareyn-unauthorized", onUnauthorized);
  }, [refresh]);

  const login = async (password: string) => {
    const ok = await apiLogin(password);
    if (ok) setAuthenticated(true);
    return ok;
  };

  const logout = async () => {
    await apiLogout();
    setAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return <LoginGate onLogin={login} />;
  }

  return (
    <AuthContext.Provider value={{ authenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
