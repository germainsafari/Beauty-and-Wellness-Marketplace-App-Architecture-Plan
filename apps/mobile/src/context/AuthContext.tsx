import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { clearToken, getToken, setToken, trpcCall } from "../lib/api";

export type UserRole = "customer" | "provider";
export type User = {
  id: number;
  name: string;
  phone: string | null;
  role: UserRole | "admin";
  isVerified: boolean;
  loyaltyPoints: number;
  walletBalance: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  activeRole: UserRole;
  setActiveRole: (r: UserRole) => void;
  login: (name: string, phone: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);
const ROLE_KEY = "hafi_active_role";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRoleState] = useState<UserRole>("customer");

  const setActiveRole = async (role: UserRole) => {
    setActiveRoleState(role);
    await SecureStore.setItemAsync(ROLE_KEY, role);
  };

  useEffect(() => {
    (async () => {
      const storedRole = await SecureStore.getItemAsync(ROLE_KEY);
      if (storedRole === "customer" || storedRole === "provider") {
        setActiveRoleState(storedRole);
      }
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        setUser(await trpcCall<User>("auth.me"));
      } catch {
        await clearToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (name: string, phone: string, role: UserRole) => {
    const result = await trpcCall<{ token: string; user: User }>(
      "auth.login",
      { name, phone, role },
      "mutation"
    );
    await setToken(result.token);
    setUser(result.user);
    await setActiveRole(role);
  }, []);

  const switchRole = useCallback(async (role: UserRole) => {
    const updated = await trpcCall<User>("auth.setRole", { role }, "mutation");
    setUser(updated);
    await setActiveRole(role);
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    await SecureStore.deleteItemAsync(ROLE_KEY);
    setUser(null);
    setActiveRoleState("customer");
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, activeRole, setActiveRole, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
