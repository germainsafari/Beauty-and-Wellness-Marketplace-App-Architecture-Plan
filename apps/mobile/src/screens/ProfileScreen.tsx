import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import { getApiUrl, getToken, resolveUploadUrl, trpcCall } from "../lib/api";
import { DEMO_DOC_URLS } from "../lib/onboarding";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useT } from "@hafi/i18n";
import { colors, radius, spacing } from "../theme";

type Section = "verification" | "loyalty" | "payments" | "notifications" | "orders" | "help";

const PAYMENTS = [
  { id: "demo", label: "Demo instant pay" },
  { id: "mtn_momo", label: "MTN MoMo" },
  { id: "airtel_money", label: "Airtel Money" },
  { id: "stripe", label: "Card (Stripe)" },
];

const REDEEM_PRESETS = [50, 100, 200];
const POINT_VALUE_RWF = 10;
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

type NotificationPrefs = { pushEnabled: boolean; emailEnabled: boolean; smsEnabled: boolean };

const PREF_ROWS: { key: keyof NotificationPrefs; label: string }[] = [
  { key: "pushEnabled", label: "Push notifications" },
  { key: "emailEnabled", label: "Email" },
  { key: "smsEnabled", label: "SMS" },
];

export default function ProfileScreen() {
  const { user, logout, activeRole, switchRole } = useAuth();
  const t = useT();
  const [open, setOpen] = useState<Section | null>("loyalty");
  const [wallet, setWallet] = useState({ balance: "0", loyaltyPoints: 0 });
  const [ledger, setLedger] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [helpTopics, setHelpTopics] = useState<any[]>([]);
  const [verification, setVerification] = useState<any[]>([]);
  const [docUrl, setDocUrl] = useState("");
  const [defaultPayment, setDefaultPayment] = useState("demo");
  const [switching, setSwitching] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs>({ pushEnabled: true, emailEnabled: true, smsEnabled: false });

  const load = useCallback(async () => {
    try {
      const [bal, led, notifs, ords, pays, help, ver, summary] = await Promise.all([
        trpcCall<{ balance: string; loyaltyPoints: number }>("wallet.balance"),
        trpcCall<any[]>("profile.loyaltyActivity"),
        trpcCall<any[]>("notifications.mine"),
        trpcCall<any[]>("profile.purchaseHistory"),
        trpcCall<any[]>("profile.paymentHistory"),
        trpcCall<any[]>("help.topics"),
        trpcCall<any[]>("verification.mine"),
        trpcCall<{ defaultPaymentProvider: string; preferences?: NotificationPrefs }>("profile.summary"),
      ]);
      setWallet(bal);
      setLedger(led);
      setNotifications(notifs);
      setOrders(ords);
      setPayments(pays);
      setHelpTopics(help);
      setVerification(ver);
      setDefaultPayment(summary.defaultPaymentProvider);
      if (summary.preferences) setPrefs(summary.preferences);
    } catch {
      /* offline */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const formatPrice = (p: string) => `RWF ${Number(p).toLocaleString()}`;
  const toggle = (s: Section) => setOpen((c) => (c === s ? null : s));

  const submitVerification = async () => {
    if (!docUrl.startsWith("https://")) {
      Alert.alert("Invalid URL", "Use a secure HTTPS document URL for the MVP demo.");
      return;
    }
    try {
      await trpcCall("verification.submit", { documentUrl: docUrl, documentType: "national_id" }, "mutation");
      setDocUrl("");
      Alert.alert("Submitted", "Admin will review within 24–48 hours.");
      load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not submit");
    }
  };

  const pickAndSubmitId = async () => {
    if (uploadingId) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo access to upload your ID.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert("Error", "Could not read the selected image.");
      return;
    }
    if (asset.base64.length * 0.75 > MAX_UPLOAD_BYTES) {
      Alert.alert("Too large", "Photo must be under 2MB. Try a smaller image.");
      return;
    }
    setUploadingId(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${getApiUrl()}/uploads`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          kind: "verification",
          mimeType: asset.mimeType || "image/jpeg",
          data: asset.base64,
        }),
      });
      const json = (await res.json().catch(() => null)) as { id?: number; error?: string } | null;
      if (!res.ok || !json?.id) {
        throw new Error(json?.error || `Upload failed (${res.status})`);
      }
      await trpcCall("verification.submit", { uploadId: json.id, documentType: "national_id" }, "mutation");
      Alert.alert("Submitted", "Your ID was uploaded — admin will review within 24–48 hours.");
      load();
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Could not upload your ID");
    } finally {
      setUploadingId(false);
    }
  };

  const redeem = async (points: number) => {
    setRedeeming(true);
    try {
      const result = await trpcCall<{
        loyaltyPoints: number;
        walletBalance: string | number;
        redeemedPoints: number;
        creditedAmount: string | number;
      }>("commerce.redeemPoints", { points }, "mutation");
      Alert.alert(
        "Points redeemed",
        `RWF ${Number(result.creditedAmount).toLocaleString()} added to your wallet. New balance: RWF ${Number(result.walletBalance).toLocaleString()}.`
      );
      load();
    } catch (e) {
      Alert.alert("Could not redeem", e instanceof Error ? e.message : "Try again later.");
    } finally {
      setRedeeming(false);
    }
  };

  const confirmRedeem = (points: number) => {
    if (redeeming) return;
    if (wallet.loyaltyPoints < points) {
      Alert.alert("Not enough points", `You have ${wallet.loyaltyPoints} pts — this option needs ${points}.`);
      return;
    }
    Alert.alert(
      "Redeem points",
      `Redeem ${points} pts for RWF ${(points * POINT_VALUE_RWF).toLocaleString()} wallet credit?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Redeem", onPress: () => redeem(points) },
      ]
    );
  };

  const togglePref = async (key: keyof NotificationPrefs) => {
    const previous = prefs;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next); // optimistic
    try {
      const res = await trpcCall<{ success: boolean; preferences: NotificationPrefs }>(
        "profile.updatePreferences",
        { [key]: next[key] },
        "mutation"
      );
      setPrefs(res.preferences);
    } catch (e) {
      setPrefs(previous);
      Alert.alert("Error", e instanceof Error ? e.message : "Could not save preference");
    }
  };

  const savePayment = async (provider: string) => {
    await trpcCall("profile.setDefaultPayment", { provider }, "mutation");
    setDefaultPayment(provider);
    Alert.alert("Saved", `Default payment: ${provider.replace("_", " ")}`);
  };

  const markAllRead = async () => {
    await trpcCall("notifications.markAllRead", {}, "mutation");
    load();
  };

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
      Alert.alert("Error", e instanceof Error ? e.message : "Could not switch mode");
    } finally {
      setSwitching(false);
    }
  };

  const unread = notifications.filter((n) => !n.isRead).length;

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

      <View style={styles.langWrap}>
        <LanguageSwitcher />
      </View>

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
          <Text style={styles.statVal}>{unread}</Text>
          <Text style={styles.statLabel}>Alerts</Text>
        </View>
      </View>

      <Section title="Identity verification" icon="shield-checkmark-outline" open={open === "verification"} onPress={() => toggle("verification")}>
        <Text style={styles.hint}>Upload a photo of your national ID (max 2MB). Admin reviews within 24–48 hours.</Text>
        <Pressable style={[styles.uploadBtn, uploadingId && styles.smallBtnDisabled]} onPress={pickAndSubmitId} disabled={uploadingId}>
          {uploadingId ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={18} color={colors.white} />
              <Text style={styles.smallBtnText}>Pick a photo of your ID</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.orDivider}>or paste a secure document URL</Text>
        <View style={styles.chipRow}>
          {DEMO_DOC_URLS.map((d) => (
            <Pressable key={d.url} style={styles.chip} onPress={() => setDocUrl(d.url)}>
              <Text style={styles.chipText}>{d.label}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput style={styles.input} placeholder="https://..." value={docUrl} onChangeText={setDocUrl} autoCapitalize="none" />
        <Pressable style={[styles.smallBtn, !docUrl.startsWith("https://") && styles.smallBtnDisabled]} onPress={submitVerification}>
          <Text style={styles.smallBtnText}>Submit</Text>
        </Pressable>
        {verification[0] && (
          <>
            <Text style={styles.meta}>Status: {verification[0].status}</Text>
            {verification[0].documentUrl ? (
              <Pressable onPress={() => Linking.openURL(resolveUploadUrl(verification[0].documentUrl))}>
                <Text style={styles.link}>View submitted document</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </Section>

      <Section title="Loyalty & rewards" icon="gift-outline" badge={`${wallet.loyaltyPoints} pts`} open={open === "loyalty"} onPress={() => toggle("loyalty")}>
        <View style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>Points balance</Text>
          <Text style={styles.pointsValue}>{wallet.loyaltyPoints} pts</Text>
          <Text style={styles.pointsHint}>1 pt = {POINT_VALUE_RWF} RWF wallet credit · redeem from 50 pts</Text>
        </View>
        <Text style={styles.subHeading}>Redeem for wallet credit</Text>
        <View style={styles.chipRow}>
          {REDEEM_PRESETS.map((p) => (
            <Pressable
              key={p}
              style={[styles.redeemChip, (redeeming || wallet.loyaltyPoints < p) && styles.redeemChipDisabled]}
              onPress={() => confirmRedeem(p)}
              disabled={redeeming || wallet.loyaltyPoints < p}
            >
              <Text style={styles.redeemChipText}>{p} pts → RWF {(p * POINT_VALUE_RWF).toLocaleString()}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.subHeading}>Recent activity</Text>
        {ledger.length === 0 ? (
          <Text style={styles.empty}>Earn points when you shop, book, or get verified.</Text>
        ) : (
          ledger.slice(0, 8).map((e) => (
            <View key={e.id} style={[styles.row, e.points < 0 && styles.rowNegative]}>
              <Text style={styles.rowLabel}>{e.reason.replaceAll("_", " ")}</Text>
              <Text style={[styles.rowVal, e.points < 0 && styles.rowValNegative]}>
                {e.points >= 0 ? "+" : ""}
                {e.points}
              </Text>
            </View>
          ))
        )}
      </Section>

      <Section title="Payment methods" icon="card-outline" open={open === "payments"} onPress={() => toggle("payments")}>
        {PAYMENTS.map((p) => (
          <Pressable key={p.id} style={[styles.payOption, defaultPayment === p.id && styles.payOptionActive]} onPress={() => savePayment(p.id)}>
            <Text style={styles.payLabel}>{p.label}</Text>
            {defaultPayment === p.id && <Ionicons name="checkmark-circle" size={20} color={colors.purple} />}
          </Pressable>
        ))}
        {payments.slice(0, 3).map((p) => (
          <Text key={p.id} style={styles.meta}>{p.purpose} · {formatPrice(p.amount)} · {p.status}</Text>
        ))}
      </Section>

      <Section title="Notifications" icon="notifications-outline" badge={unread ? String(unread) : undefined} open={open === "notifications"} onPress={() => toggle("notifications")}>
        <Text style={styles.subHeading}>Preferences</Text>
        {PREF_ROWS.map(({ key, label }) => (
          <View key={key} style={styles.prefRow}>
            <Text style={styles.prefLabel}>{label}</Text>
            <Switch
              value={prefs[key]}
              onValueChange={() => togglePref(key)}
              trackColor={{ false: "#E5E7EB", true: colors.purpleLight }}
              thumbColor={prefs[key] ? colors.purple : colors.white}
            />
          </View>
        ))}

        {notifications.length === 0 ? (
          <Text style={styles.empty}>No notifications yet.</Text>
        ) : (
          <>
            <Pressable onPress={markAllRead}><Text style={styles.link}>Mark all as read</Text></Pressable>
            {notifications.slice(0, 6).map((n) => (
              <View key={n.id} style={[styles.notif, !n.isRead && styles.notifUnread]}>
                <Text style={styles.notifTitle}>{n.title}</Text>
                {n.body ? <Text style={styles.meta}>{n.body}</Text> : null}
              </View>
            ))}
          </>
        )}
      </Section>

      <Section title="Purchase history" icon="bag-handle-outline" badge={orders.length ? String(orders.length) : undefined} open={open === "orders"} onPress={() => toggle("orders")}>
        {orders.length === 0 ? (
          <Text style={styles.empty}>No purchases yet.</Text>
        ) : (
          orders.slice(0, 8).map(({ order, listing }: any) => (
            <View key={order.id} style={styles.row}>
              <Text style={styles.rowLabel} numberOfLines={1}>{listing.title}</Text>
              <Text style={styles.rowVal}>{formatPrice(order.totalAmount)}</Text>
            </View>
          ))
        )}
      </Section>

      <Section title="Help & support" icon="help-circle-outline" open={open === "help"} onPress={() => toggle("help")}>
        {helpTopics.map((t: any) => (
          <View key={t.id} style={styles.helpItem}>
            <Text style={styles.helpTitle}>{t.title}</Text>
            <Text style={styles.meta}>{t.body}</Text>
          </View>
        ))}
        <Pressable onPress={() => Linking.openURL("mailto:support@hafi.rw")}>
          <Text style={styles.link}>Email support@hafi.rw</Text>
        </Pressable>
      </Section>

      <Pressable style={[styles.switchBtn, switching && { opacity: 0.7 }]} onPress={handleSwitchRole} disabled={switching}>
        {switching ? <ActivityIndicator color={colors.white} /> : (
          <Text style={styles.switchText}>Switch to {activeRole === "provider" ? "Client" : "Merchant"} mode</Text>
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

function Section({
  title,
  icon,
  badge,
  open,
  onPress,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: string;
  open: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Pressable style={styles.sectionHead} onPress={onPress}>
        <Ionicons name={icon} size={20} color={colors.purple} />
        <Text style={styles.sectionTitle}>{title}</Text>
        {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.gray400} />
      </Pressable>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
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
  statsRow: { flexDirection: "row", backgroundColor: colors.white, marginHorizontal: spacing.md, marginTop: spacing.sm, borderRadius: radius.xl, padding: spacing.md },
  langWrap: { marginHorizontal: spacing.md, marginTop: spacing.sm },
  stat: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 14, fontWeight: "900", color: colors.purpleDark },
  statLabel: { fontSize: 11, color: colors.gray400, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "#EDE9FE" },
  section: { marginHorizontal: spacing.md, marginTop: spacing.sm, backgroundColor: colors.white, borderRadius: radius.xl, overflow: "hidden" },
  sectionHead: { flexDirection: "row", alignItems: "center", padding: spacing.md, gap: spacing.sm },
  sectionTitle: { flex: 1, fontWeight: "800", color: colors.purpleDark },
  badge: { fontSize: 10, fontWeight: "800", backgroundColor: colors.purpleBg, color: colors.purple, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  sectionBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  hint: { fontSize: 12, color: colors.gray400, marginBottom: spacing.sm },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  chip: { backgroundColor: colors.purpleBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  chipText: { fontSize: 11, fontWeight: "700", color: colors.purple },
  input: { backgroundColor: colors.purpleBg, borderRadius: radius.lg, padding: spacing.sm, marginBottom: spacing.sm, fontSize: 14 },
  smallBtn: { backgroundColor: colors.purple, borderRadius: radius.lg, paddingVertical: 10, alignItems: "center" },
  smallBtnDisabled: { opacity: 0.5 },
  smallBtnText: { color: colors.white, fontWeight: "800" },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.purple,
    borderRadius: radius.lg,
    paddingVertical: 12,
    marginBottom: spacing.sm,
    minHeight: 44,
  },
  orDivider: { fontSize: 11, color: colors.gray400, textAlign: "center", marginVertical: spacing.sm },
  pointsCard: { backgroundColor: colors.purple, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm },
  pointsLabel: { fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: "700", textTransform: "uppercase" },
  pointsValue: { fontSize: 28, fontWeight: "900", color: colors.white, marginTop: 2 },
  pointsHint: { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 4 },
  subHeading: { fontSize: 12, fontWeight: "800", color: colors.gray600, marginTop: spacing.sm, marginBottom: spacing.sm },
  redeemChip: { backgroundColor: colors.purpleBg, borderWidth: 1, borderColor: "#DDD6FE", paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full },
  redeemChipDisabled: { opacity: 0.4 },
  redeemChipText: { fontSize: 12, fontWeight: "800", color: colors.purple },
  prefRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  prefLabel: { fontSize: 13, fontWeight: "700", color: colors.gray800 },
  empty: { fontSize: 13, color: colors.gray400 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F9FAFB" },
  rowNegative: { backgroundColor: "#FFF1F2", marginHorizontal: -8, paddingHorizontal: 8, borderRadius: radius.md },
  rowLabel: { flex: 1, fontSize: 13, color: colors.gray800, textTransform: "capitalize" },
  rowVal: { fontWeight: "800", color: colors.purple },
  rowValNegative: { color: colors.rose },
  payOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: "#F3F4F6", marginBottom: spacing.sm },
  payOptionActive: { borderColor: colors.purple, backgroundColor: colors.purpleBg },
  payLabel: { fontWeight: "700", color: colors.purpleDark },
  meta: { fontSize: 11, color: colors.gray400, marginTop: 4 },
  link: { fontSize: 13, fontWeight: "700", color: colors.purple, marginBottom: spacing.sm },
  notif: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F9FAFB" },
  notifUnread: { backgroundColor: colors.purpleBg, marginHorizontal: -8, paddingHorizontal: 8, borderRadius: radius.md },
  notifTitle: { fontWeight: "700", fontSize: 13, color: colors.purpleDark },
  helpItem: { marginBottom: spacing.sm },
  helpTitle: { fontWeight: "700", fontSize: 13, color: colors.purpleDark },
  switchBtn: { marginHorizontal: spacing.md, marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.purple, borderRadius: radius.xl, alignItems: "center", minHeight: 52, justifyContent: "center" },
  switchText: { color: colors.white, fontWeight: "700" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, margin: spacing.md, padding: spacing.md, backgroundColor: colors.white, borderRadius: radius.xl },
  logoutText: { color: colors.rose, fontWeight: "700" },
  version: { textAlign: "center", color: colors.gray400, fontSize: 12, marginBottom: spacing.xl * 2 },
});
