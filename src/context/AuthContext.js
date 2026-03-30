"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [voiceSecondsUsed, setVoiceSecondsUsed] = useState(0);
  const [freeVoiceSecondsLimit, setFreeVoiceSecondsLimit] = useState(600);
  const [ready, setReady] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setVoiceSecondsUsed(data.voiceSecondsUsed ?? 0);
        if (typeof data.freeVoiceSecondsLimit === "number") setFreeVoiceSecondsLimit(data.freeVoiceSecondsLimit);
      } else {
        setUser(null);
        setVoiceSecondsUsed(0);
      }
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    setUser(data.user);
    setVoiceSecondsUsed(data.voiceSecondsUsed ?? 0);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");
    setUser(data.user);
    setVoiceSecondsUsed(data.voiceSecondsUsed ?? 0);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    setVoiceSecondsUsed(0);
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      voiceSecondsUsed,
      freeVoiceSecondsLimit,
      refreshUser,
      login,
      register,
      logout,
    }),
    [user, ready, voiceSecondsUsed, freeVoiceSecondsLimit, refreshUser, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
