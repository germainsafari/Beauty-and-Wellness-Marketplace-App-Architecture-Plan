import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
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
  location: string | null;
  bio: string | null;
};

type AppContextType = {
  user: User | null;
  loading: boolean;
  selectedRole: UserRole | null;
  setSelectedRole: (role: UserRole) => void;
  signIn: (phone: string) => Promise<void>;
  login: (name: string, phone: string, role: UserRole) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
};

const AppContext = createContext<AppContextType | null>(null);
const ROLE_KEY = "hafi_selected_role";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRoleState] = useState<UserRole | null>(() => {
    const stored = localStorage.getItem(ROLE_KEY);
    return stored === "customer" || stored === "provider" ? stored : null;
  });

  const setSelectedRole = (role: UserRole) => {
    localStorage.setItem(ROLE_KEY, role);
    setSelectedRoleState(role);
  };

  useEffect(() => {
    (async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await trpcCall<User>("auth.me");
        setUser(me);
        if (!localStorage.getItem(ROLE_KEY)) {
          setSelectedRole(me.role === "provider" ? "provider" : "customer");
        }
      } catch {
        clearToken();
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
    setToken(result.token);
    setUser(result.user);
    setSelectedRole(result.user.role === "provider" ? "provider" : "customer");
  }, []);

  const signIn = useCallback(async (phone: string) => {
    const result = await trpcCall<{ token: string; user: User }>(
      "auth.signIn",
      { phone },
      "mutation"
    );
    setToken(result.token);
    setUser(result.user);
    setSelectedRole(result.user.role === "provider" ? "provider" : "customer");
  }, []);

  const switchRole = useCallback(async (role: UserRole) => {
    const updated = await trpcCall<User>("auth.setRole", { role }, "mutation");
    setUser(updated);
    setSelectedRole(role);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem(ROLE_KEY);
    setUser(null);
    setSelectedRoleState(null);
  }, []);

  return (
    <AppContext.Provider
      value={{ user, loading, selectedRole, setSelectedRole, signIn, login, logout, switchRole }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
