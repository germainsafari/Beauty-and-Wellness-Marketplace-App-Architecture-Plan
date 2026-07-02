import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
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
  location: string | null;
  bio: string | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  activeRole: UserRole;
  setActiveRole: (r: UserRole) => void;
  signIn: (phone: string) => Promise<void>;
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

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const permissions = await Notifications.getPermissionsAsync();
        const finalPermissions =
          permissions.status === "granted" ? permissions : await Notifications.requestPermissionsAsync();
        if (finalPermissions.status !== "granted") return;
        const token = await Notifications.getExpoPushTokenAsync();
        await trpcCall("push.registerToken", { platform: "expo", token: token.data }, "mutation");
      } catch {
        /* Push tokens are best-effort in Expo Go/local dev. */
      }
    })();
  }, [user]);

  const login = useCallback(async (name: string, phone: string, role: UserRole) => {
    const result = await trpcCall<{ token: string; user: User }>(
      "auth.login",
      { name, phone, role },
      "mutation"
    );
    await setToken(result.token);
    setUser(result.user);
    await setActiveRole(result.user.role === "provider" ? "provider" : "customer");
  }, []);

  const signIn = useCallback(async (phone: string) => {
    const result = await trpcCall<{ token: string; user: User }>(
      "auth.signIn",
      { phone },
      "mutation"
    );
    await setToken(result.token);
    setUser(result.user);
    await setActiveRole(result.user.role === "provider" ? "provider" : "customer");
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
    <AuthContext.Provider value={{ user, loading, activeRole, setActiveRole, signIn, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
