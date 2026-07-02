import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useT } from "@hafi/i18n";
import { trpcCall } from "../lib/api";
import { colors, radius, spacing } from "../theme";
import type { RootStackParamList } from "../navigation/types";

type Category = { id: number; name: string; icon: string | null };
type Service = {
  service: { id: number; name: string; price: string; duration: number };
  provider: { businessName: string; address: string; rating: string };
  category: Category | null;
};
type Provider = {
  profile: { id: number; businessName: string; address: string; rating: string; reviewCount: number; description: string | null };
  user: { isVerified: boolean };
  distanceKm: number | null;
};

export default function DiscoverScreen() {
  const t = useT();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useLayoutEffect(() => {
    navigation.setOptions({ title: t("nav.discover"), headerShown: true });
  }, [navigation, t]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [cats, svc, prov] = await Promise.all([
        trpcCall<Category[]>("discovery.categories"),
        trpcCall<Service[]>("bookings.services"),
        trpcCall<Provider[]>("discovery.nearbyProviders", { latitude: -1.9441, longitude: 30.0619 }),
      ]);
      setCategories(cats);
      setServices(svc);
      setProviders(prov);
    } catch {
      /* offline */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const formatPrice = (p: string) => `RWF ${Number(p).toLocaleString()}`;

  const filtered = services.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q || s.service.name.toLowerCase().includes(q) || s.provider.businessName.toLowerCase().includes(q);
    const matchCat = category === "all" || s.category?.name.toLowerCase() === category.toLowerCase();
    return matchSearch && matchCat;
  });

  const book = async (serviceId: number, name: string) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    try {
      await trpcCall("bookings.create", { serviceId, scheduledAt: d.toISOString() }, "mutation");
      Alert.alert("Booked! ✨", `${name} — check Bookings for details.`);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Booking failed");
    }
  };

  const pills = [{ name: "all", icon: "✨" }, ...categories.map((c) => ({ name: c.name.toLowerCase(), icon: c.icon ?? "•" }))];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.purple} />}
    >
      <Text style={styles.title}>{t("discover.title")}</Text>
      <Text style={styles.sub}>{t("mobile.bookServices")}</Text>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.gray400} />
        <TextInput
          style={styles.searchInput}
          placeholder={t("discover.searchPlaceholder")}
          placeholderTextColor={colors.gray400}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
        {pills.map((p) => (
          <Pressable
            key={p.name}
            style={[styles.pill, category === p.name && styles.pillActive]}
            onPress={() => setCategory(p.name)}
          >
            <Text style={styles.pillIcon}>{p.icon}</Text>
            <Text style={[styles.pillText, category === p.name && styles.pillTextActive]}>{p.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.section}>{t("mobile.nearbyProviders")}</Text>
      {providers.slice(0, 4).map(({ profile, user, distanceKm }) => (
        <View key={profile.id} style={styles.providerCard}>
          <Text style={styles.providerName}>
            {profile.businessName}
            {user.isVerified ? " ✓" : ""}
          </Text>
          <Text style={styles.providerMeta}>★ {profile.rating} · {profile.address}{distanceKm != null ? ` · ${distanceKm} km` : ""}</Text>
          <Text style={styles.providerDesc} numberOfLines={2}>{profile.description}</Text>
        </View>
      ))}

      <Text style={styles.section}>{t("mobile.availableServices")}</Text>
      {loading ? (
        <ActivityIndicator color={colors.purple} style={{ marginVertical: 24 }} />
      ) : (
        filtered.map(({ service, provider, category: cat }) => (
          <View key={service.id} style={styles.serviceCard}>
            <View style={styles.serviceRow}>
              <Text style={styles.serviceIcon}>{cat?.icon ?? "✨"}</Text>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceProvider}>{provider.businessName}</Text>
                <Text style={styles.serviceMeta}>{service.duration} min · {formatPrice(service.price)}</Text>
              </View>
              <Pressable style={styles.bookBtn} onPress={() => book(service.id, service.name)}>
                <Text style={styles.bookBtnText}>{t("common.book")}</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.purpleBg, padding: spacing.md },
  title: { fontSize: 26, fontWeight: "900", color: colors.purpleDark },
  sub: { color: colors.gray400, marginBottom: spacing.md },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: radius.xl, paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.md },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.gray800 },
  pillScroll: { marginBottom: spacing.md, maxHeight: 44 },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, marginRight: spacing.sm },
  pillActive: { backgroundColor: colors.purple },
  pillIcon: { fontSize: 14 },
  pillText: { fontSize: 12, fontWeight: "700", color: colors.gray600, textTransform: "capitalize" },
  pillTextActive: { color: colors.white },
  section: { fontSize: 16, fontWeight: "900", color: colors.purpleDark, marginBottom: spacing.sm, marginTop: spacing.sm },
  providerCard: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.sm },
  providerName: { fontWeight: "800", fontSize: 16, color: colors.purpleDark },
  providerMeta: { fontSize: 12, color: colors.gray400, marginTop: 4 },
  providerDesc: { fontSize: 13, color: colors.gray600, marginTop: 6 },
  serviceCard: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.sm },
  serviceRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  serviceIcon: { fontSize: 24 },
  serviceInfo: { flex: 1 },
  serviceName: { fontWeight: "700", color: colors.purpleDark },
  serviceProvider: { fontSize: 12, color: colors.purple, fontWeight: "600" },
  serviceMeta: { fontSize: 11, color: colors.gray400, marginTop: 2 },
  bookBtn: { backgroundColor: colors.purple, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.lg },
  bookBtnText: { color: colors.white, fontWeight: "800", fontSize: 12 },
});
