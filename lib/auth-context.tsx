import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback, ReactNode } from "react";
import { AppState, AppStateStatus } from "react-native";
import { apiRequest, getApiUrl, queryClient } from "@/lib/query-client";
import { fetch } from "expo/fetch";
import { router } from "expo-router";

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

interface Surgeon {
  id: number;
  username: string;
  fullName: string;
  isAdmin: boolean;
}

interface AuthContextValue {
  surgeon: Surgeon | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetActivityTimer: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [surgeon, setSurgeon] = useState<Surgeon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActiveTime = useRef<number>(Date.now());

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

  const surgeonRef = useRef<Surgeon | null>(null);
  const isLoggingOut = useRef(false);

  useEffect(() => {
    surgeonRef.current = surgeon;
  }, [surgeon]);

  const performLogout = useCallback(async () => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
    setSurgeon(null);
    queryClient.cancelQueries();
    queryClient.clear();
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/auth/logout", baseUrl);
      fetch(url.toString(), { method: "POST", credentials: "include" });
    } catch (e) {}
    isLoggingOut.current = false;
  }, []);

  const resetActivityTimer = useCallback(() => {
    lastActiveTime.current = Date.now();
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    if (surgeonRef.current) {
      inactivityTimer.current = setTimeout(() => {
        performLogout();
      }, INACTIVITY_TIMEOUT_MS);
    }
  }, [performLogout]);

  useEffect(() => {
    if (surgeon) {
      resetActivityTimer();
    } else {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
    }
    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [surgeon]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && surgeonRef.current) {
        const elapsed = Date.now() - lastActiveTime.current;
        if (elapsed >= INACTIVITY_TIMEOUT_MS) {
          performLogout();
        } else {
          resetActivityTimer();
        }
      } else if (nextAppState === "background" || nextAppState === "inactive") {
        lastActiveTime.current = Date.now();
      }
    };
    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [performLogout, resetActivityTimer]);

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
    await performLogout();
  }

  const value = useMemo(
    () => ({ surgeon, isLoading, login, register, logout, resetActivityTimer }),
    [surgeon, isLoading, resetActivityTimer]
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
