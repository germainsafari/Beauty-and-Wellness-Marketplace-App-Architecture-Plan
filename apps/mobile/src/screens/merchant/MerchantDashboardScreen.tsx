import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { trpcCall } from "../../lib/api";
import { colors, radius, spacing } from "../../theme";

export default function MerchantDashboardScreen() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trpcCall("merchant.dashboard")
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load dashboard"));
  }, []);

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorTitle}>Dashboard unavailable</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!data) return <ActivityIndicator color={colors.gold} style={{ flex: 1, marginTop: 80 }} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Merchant Dashboard</Text>
      <Text style={styles.business}>{data.profile.businessName}</Text>

      <View style={styles.grid}>
        {[
          { label: "Today", value: String(data.todayAppointments), icon: "calendar" as const },
          { label: "Week revenue", value: `RWF ${Number(data.weekRevenue).toLocaleString()}`, icon: "cash" as const },
          { label: "Listings", value: String(data.activeListings), icon: "pricetags" as const },
          { label: "Offers", value: String(data.pendingOffers), icon: "mail" as const },
        ].map((s) => (
          <View key={s.label} style={styles.stat}>
            <Ionicons name={s.icon} size={22} color={colors.gold} />
            <Text style={styles.statVal}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.ratingCard}>
        <Text style={styles.ratingLabel}>Your rating</Text>
        <Text style={styles.rating}>⭐ {data.profile.rating}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  content: { padding: spacing.md, paddingTop: spacing.xl },
  greeting: { fontSize: 14, color: colors.gray400 },
  business: { fontSize: 26, fontWeight: "900", color: colors.purpleDark, marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  stat: { width: "47%", backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md },
  statVal: { fontSize: 18, fontWeight: "900", color: colors.purpleDark, marginTop: spacing.sm },
  statLabel: { fontSize: 12, color: colors.gray400, marginTop: 2 },
  ratingCard: { backgroundColor: colors.purpleDark, borderRadius: radius.xl, padding: spacing.lg, marginTop: spacing.lg },
  ratingLabel: { color: "#C4B5FD", fontSize: 13 },
  rating: { color: colors.white, fontSize: 32, fontWeight: "900", marginTop: spacing.sm },
  centered: { alignItems: "center", justifyContent: "center", padding: spacing.lg },
  errorTitle: { fontSize: 18, fontWeight: "800", color: colors.purpleDark, marginBottom: spacing.sm },
  errorText: { color: colors.gray400, textAlign: "center" },
});
