import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { clearToken, getToken, setToken, trpcCall } from "../lib/api";

export type User = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  role: string;
  isVerified: boolean;
  loyaltyPoints: number;
  walletBalance: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (name: string, phone: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        setUser(await trpcCall<User>("auth.me"));
      } catch {
        clearToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (name: string, phone: string) => {
    const result = await trpcCall<{ token: string; user: User }>("auth.login", { name, phone }, "mutation");
    setToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
