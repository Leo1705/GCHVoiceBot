"use client";

import { createContext, useContext } from "react";

const AuthContext = createContext(null);

const GUEST = { id: "guest", name: "Guest", email: null };

export function AuthProvider({ children }) {
  return (
    <AuthContext.Provider value={{ user: GUEST, ready: true, login: () => {}, register: () => {}, logout: () => {} }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
