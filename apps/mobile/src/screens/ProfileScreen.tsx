import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { trpcCall } from "../lib/api";
import { colors, radius, spacing } from "../theme";

export default function ProfileScreen() {
  const { user, logout, activeRole, switchRole } = useAuth();
  const [wallet, setWallet] = useState({ balance: "0", loyaltyPoints: 0 });
  const [notifCount, setNotifCount] = useState(0);
  const [switching, setSwitching] = useState(false);

  const load = useCallback(async () => {
    try {
      const [bal, notifs] = await Promise.all([
        trpcCall<{ balance: string; loyaltyPoints: number }>("wallet.balance"),
        trpcCall<{ isRead: boolean }[]>("notifications.mine"),
      ]);
      setWallet(bal);
      setNotifCount(notifs.filter((n) => !n.isRead).length);
    } catch {
      /* empty */
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);
  };

  const handleSwitchRole = async () => {
    const nextRole = activeRole === "provider" ? "customer" : "provider";
    setSwitching(true);
    try {
      await switchRole(nextRole);
    } catch (e) {
      Alert.alert(
        "Could not switch mode",
        e instanceof Error ? e.message : "Check that the API is running and reachable from your phone."
      );
    } finally {
      setSwitching(false);
    }
  };

  const formatPrice = (p: string) => `RWF ${Number(p).toLocaleString()}`;

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={[colors.purple, colors.purpleLight]} style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name?.[0] || "H").toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
        {user?.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={colors.white} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statVal}>{wallet.loyaltyPoints}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statVal}>{formatPrice(wallet.balance)}</Text>
          <Text style={styles.statLabel}>Wallet</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statVal}>{notifCount}</Text>
          <Text style={styles.statLabel}>Alerts</Text>
        </View>
      </View>

      <View style={styles.menu}>
        {[
          { icon: "bag-handle-outline" as const, label: "My Listings", desc: "Manage your marketplace items" },
          { icon: "heart-outline" as const, label: "Favorites", desc: "Saved items" },
          { icon: "card-outline" as const, label: "Payment Methods", desc: "MTN MoMo, Cards" },
          { icon: "notifications-outline" as const, label: "Notifications", desc: "Booking & offer alerts" },
          { icon: "help-circle-outline" as const, label: "Help & Support", desc: "Get help from Hafi team" },
        ].map((item) => (
          <Pressable key={item.label} style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons name={item.icon} size={22} color={colors.purple} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuDesc}>{item.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.switchBtn, switching && styles.switchBtnDisabled]}
        onPress={handleSwitchRole}
        disabled={switching}
      >
        {switching ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.switchText}>
            Switch to {activeRole === "provider" ? "Client" : "Merchant"} mode
          </Text>
        )}
      </Pressable>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.rose} />
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
      <Text style={styles.version}>Hafi v1.0.0 · Made with 💜 in Rwanda</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.purpleBg },
  header: { alignItems: "center", padding: spacing.xl, paddingTop: spacing.xl * 1.5 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  avatarText: { fontSize: 32, fontWeight: "900", color: colors.white },
  name: { fontSize: 22, fontWeight: "900", color: colors.white },
  phone: { color: "rgba(255,255,255,0.7)", marginTop: 4 },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full, marginTop: spacing.sm },
  verifiedText: { color: colors.white, fontSize: 12, fontWeight: "600" },
  statsRow: { flexDirection: "row", backgroundColor: colors.white, marginHorizontal: spacing.md, marginTop: -spacing.lg, borderRadius: radius.xl, padding: spacing.md },
  stat: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 16, fontWeight: "900", color: colors.purpleDark },
  statLabel: { fontSize: 11, color: colors.gray400, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "#EDE9FE" },
  menu: { margin: spacing.md, backgroundColor: colors.white, borderRadius: radius.xl, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  menuIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.purpleBg, alignItems: "center", justifyContent: "center" },
  menuInfo: { flex: 1, marginLeft: spacing.md },
  menuLabel: { fontWeight: "700", color: colors.purpleDark },
  menuDesc: { fontSize: 12, color: colors.gray400, marginTop: 2 },
  switchBtn: { marginHorizontal: spacing.md, marginBottom: spacing.sm, padding: spacing.md, backgroundColor: colors.purple, borderRadius: radius.xl, alignItems: "center", minHeight: 52, justifyContent: "center" },
  switchBtnDisabled: { opacity: 0.7 },
  switchText: { color: colors.white, fontWeight: "700" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, margin: spacing.md, padding: spacing.md, backgroundColor: colors.white, borderRadius: radius.xl },
  logoutText: { color: colors.rose, fontWeight: "700" },
  version: { textAlign: "center", color: colors.gray400, fontSize: 12, marginBottom: spacing.xl * 2 },
});
