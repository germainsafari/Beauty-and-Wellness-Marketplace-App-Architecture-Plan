import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useT } from "@hafi/i18n";
import { trpcCall } from "../../lib/api";
import { colors, radius, spacing } from "../../theme";

type Service = {
  id: number;
  name: string;
  description: string | null;
  duration: number;
  price: string;
  categoryName: string | null;
  categoryIcon: string | null;
};

export default function MerchantServicesScreen() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trpcCall<Service[]>("merchant.services")
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (p: string) => `RWF ${Number(p).toLocaleString()}`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
    >
      <Text style={styles.title}>{t("merchant.nav.services")}</Text>
      <Text style={styles.subtitle}>{t("merchant.servicesSubtitle")}</Text>

      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
      ) : services.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="briefcase-outline" size={48} color={colors.gray400} />
          <Text style={styles.emptyTitle}>{t("merchant.servicesEmpty")}</Text>
        </View>
      ) : (
        services.map((service) => (
          <View key={service.id} style={styles.card}>
            <View style={styles.cardHeader}>
              {service.categoryIcon ? <Text style={styles.categoryIcon}>{service.categoryIcon}</Text> : null}
              {service.categoryName ? (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{service.categoryName}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.serviceName}>{service.name}</Text>
            {service.description ? (
              <Text style={styles.serviceDesc} numberOfLines={2}>{service.description}</Text>
            ) : null}
            <Text style={styles.duration}>{service.duration} min</Text>
            <Text style={styles.price}>{formatPrice(service.price)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  title: { fontSize: 26, fontWeight: "900", color: colors.purpleDark },
  subtitle: { fontSize: 14, color: colors.gray400, marginBottom: spacing.lg },
  empty: { alignItems: "center", padding: spacing.xl * 2, backgroundColor: colors.white, borderRadius: radius.xl },
  emptyTitle: { fontSize: 14, color: colors.gray400, marginTop: spacing.md, textAlign: "center" },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.sm },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  categoryIcon: { fontSize: 20 },
  categoryBadge: { backgroundColor: colors.purpleBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  categoryText: { fontSize: 11, fontWeight: "700", color: colors.purple },
  serviceName: { fontSize: 17, fontWeight: "800", color: colors.purpleDark },
  serviceDesc: { fontSize: 13, color: colors.gray400, marginTop: 4 },
  duration: { fontSize: 13, color: colors.gray400, marginTop: spacing.sm },
  price: { fontSize: 20, fontWeight: "900", color: colors.purple, marginTop: spacing.sm },
});
