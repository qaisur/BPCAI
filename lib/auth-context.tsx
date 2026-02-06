import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";

interface Surgeon {
  id: number;
  username: string;
  fullName: string;
}

interface AuthContextValue {
  surgeon: Surgeon | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [surgeon, setSurgeon] = useState<Surgeon | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/auth/me", baseUrl);
      const res = await fetch(url.toString(), { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSurgeon(data);
      }
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  }

  async function login(username: string, password: string) {
    const res = await apiRequest("POST", "/api/auth/login", { username, password });
    const data = await res.json();
    setSurgeon(data);
  }

  async function register(username: string, password: string, fullName: string) {
    const res = await apiRequest("POST", "/api/auth/register", {
      username,
      password,
      fullName,
    });
    const data = await res.json();
    setSurgeon(data);
  }

  async function logout() {
    await apiRequest("POST", "/api/auth/logout");
    setSurgeon(null);
  }

  const value = useMemo(
    () => ({ surgeon, isLoading, login, register, logout }),
    [surgeon, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
