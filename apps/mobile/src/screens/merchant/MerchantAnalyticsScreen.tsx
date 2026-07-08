import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useT } from "@hafi/i18n";
import { trpcCall } from "../../lib/api";
import { colors, radius, spacing } from "../../theme";

export default function MerchantAnalyticsScreen() {
  const t = useT();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trpcCall("merchant.dashboard")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (p: string | number) => `RWF ${Number(p).toLocaleString()}`;

  if (loading) {
    return <ActivityIndicator color={colors.gold} style={{ flex: 1, marginTop: 80 }} />;
  }

  const stats = [
    { label: t("merchant.statWeekRevenue"), value: data ? formatPrice(data.weekRevenue) : "—", icon: "cash-outline" as const },
    { label: t("merchant.statTodayBookings"), value: data?.todayAppointments ?? "—", icon: "calendar-outline" as const },
    { label: t("merchant.statActiveListings"), value: data?.activeListings ?? "—", icon: "pricetags-outline" as const },
    { label: t("merchant.statPendingOffers"), value: data?.pendingOffers ?? "—", icon: "mail-outline" as const },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>{t("merchant.analyticsSubtitle")}</Text>

      <View style={styles.grid}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Ionicons name={s.icon} size={22} color={colors.gold} />
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.chartPlaceholder}>
        <Ionicons name="bar-chart" size={40} color={colors.gray400} />
        <Text style={styles.chartText}>{t("merchant.chartPlaceholder")}</Text>
      </View>

      {data?.profile?.rating != null && (
        <View style={styles.ratingCard}>
          <Text style={styles.ratingLabel}>{t("merchant.yourRating")}</Text>
          <Text style={styles.ratingValue}>⭐ {data.profile.rating}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  subtitle: { fontSize: 14, color: colors.gray400, marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  statCard: { width: "47%", backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md },
  statValue: { fontSize: 18, fontWeight: "900", color: colors.purpleDark, marginTop: spacing.sm },
  statLabel: { fontSize: 11, color: colors.gray400, marginTop: 4 },
  chartPlaceholder: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    height: 200,
    marginTop: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  chartText: { fontSize: 13, color: colors.gray400, textAlign: "center", paddingHorizontal: spacing.lg },
  ratingCard: { backgroundColor: colors.purpleDark, borderRadius: radius.xl, padding: spacing.lg, marginTop: spacing.lg },
  ratingLabel: { color: "#C4B5FD", fontSize: 13 },
  ratingValue: { color: colors.white, fontSize: 32, fontWeight: "900", marginTop: spacing.sm },
});
