import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
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
import * as Location from "expo-location";
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
  profile: {
    id: number;
    businessName: string;
    address: string;
    district: string | null;
    rating: string;
    reviewCount: number;
    description: string | null;
    latitude: string | null;
    longitude: string | null;
  };
  user: { isVerified: boolean };
  distanceKm: number | null;
};
type DistrictInfo = { district: string; providerCount: number };

const KIGALI_CENTER = { latitude: -1.9441, longitude: 30.0619 };

export default function DiscoverScreen() {
  const t = useT();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useLayoutEffect(() => {
    navigation.setOptions({ title: t("nav.discover"), headerShown: true });
  }, [navigation, t]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [districts, setDistricts] = useState<DistrictInfo[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [district, setDistrict] = useState("all");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>(KIGALI_CENTER);
  const [usingFallbackLocation, setUsingFallbackLocation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Device location with graceful fallback to central Kigali.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (!cancelled) setUsingFallbackLocation(true);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setUsingFallbackLocation(false);
        }
      } catch {
        if (!cancelled) setUsingFallbackLocation(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    try {
      const providerInput: { latitude: number; longitude: number; district?: string } = {
        ...coords,
      };
      if (district !== "all") providerInput.district = district;
      const [cats, svc, prov, dists] = await Promise.all([
        trpcCall<Category[]>("discovery.categories"),
        trpcCall<Service[]>("bookings.services"),
        trpcCall<Provider[]>("discovery.nearbyProviders", providerInput),
        trpcCall<DistrictInfo[]>("discovery.districts"),
      ]);
      setCategories(cats);
      setServices(svc);
      setProviders(prov);
      setDistricts(dists);
    } catch {
      /* offline */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [coords, district]);

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

  const openInMaps = (p: Provider["profile"]) => {
    const query =
      p.latitude && p.longitude
        ? `${p.latitude},${p.longitude}`
        : `${p.businessName}, ${p.district ?? "Kigali"}, Rwanda`;
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    ).catch(() => {});
  };

  const pills = [{ name: "all", icon: "✨" }, ...categories.map((c) => ({ name: c.name.toLowerCase(), icon: c.icon ?? "•" }))];
  const districtPills = [{ district: "all", providerCount: 0 }, ...districts];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.purple} />}
    >
      <Text style={styles.title}>{t("discover.title")}</Text>
      <Text style={styles.sub}>{t("mobile.bookServices")}</Text>
      {usingFallbackLocation && (
        <View style={styles.locationHint}>
          <Ionicons name="location-outline" size={14} color={colors.gold} />
          <Text style={styles.locationHintText}>
            Using Kigali center — enable location for accurate distances
          </Text>
        </View>
      )}

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

      {districts.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
          {districtPills.map((d) => (
            <Pressable
              key={d.district}
              style={[styles.districtPill, district === d.district && styles.districtPillActive]}
              onPress={() => setDistrict(d.district)}
            >
              <Text
                style={[
                  styles.districtPillText,
                  district === d.district && styles.districtPillTextActive,
                ]}
              >
                {d.district === "all" ? "All districts" : `${d.district} · ${d.providerCount}`}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <Text style={styles.section}>{t("mobile.nearbyProviders")}</Text>
      {providers.slice(0, 6).map(({ profile, user, distanceKm }) => (
        <View key={profile.id} style={styles.providerCard}>
          <Text style={styles.providerName}>
            {profile.businessName}
            {user.isVerified ? " ✓" : ""}
          </Text>
          <Text style={styles.providerMeta}>
            ★ {profile.rating} · {profile.address}
            {distanceKm != null ? ` · ${distanceKm} km` : ""}
          </Text>
          <View style={styles.providerFooter}>
            {profile.district ? (
              <View style={styles.districtBadge}>
                <Ionicons name="location" size={11} color={colors.purple} />
                <Text style={styles.districtBadgeText}>{profile.district}</Text>
              </View>
            ) : (
              <View />
            )}
            <Pressable style={styles.mapsBtn} onPress={() => openInMaps(profile)}>
              <Ionicons name="map-outline" size={13} color={colors.white} />
              <Text style={styles.mapsBtnText}>Open in Maps</Text>
            </Pressable>
          </View>
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
  sub: { color: colors.gray400, marginBottom: spacing.sm },
  locationHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF7E6",
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
  },
  locationHintText: { fontSize: 11, fontWeight: "700", color: "#B45309" },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: radius.xl, paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.md },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.gray800 },
  pillScroll: { marginBottom: spacing.md, maxHeight: 44 },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, marginRight: spacing.sm },
  pillActive: { backgroundColor: colors.purple },
  pillIcon: { fontSize: 14 },
  pillText: { fontSize: 12, fontWeight: "700", color: colors.gray600, textTransform: "capitalize" },
  pillTextActive: { color: colors.white },
  districtPill: { backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, marginRight: spacing.sm },
  districtPillActive: { backgroundColor: colors.gold },
  districtPillText: { fontSize: 12, fontWeight: "700", color: colors.gray600 },
  districtPillTextActive: { color: colors.white },
  section: { fontSize: 16, fontWeight: "900", color: colors.purpleDark, marginBottom: spacing.sm, marginTop: spacing.sm },
  providerCard: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.sm },
  providerName: { fontWeight: "800", fontSize: 16, color: colors.purpleDark },
  providerMeta: { fontSize: 12, color: colors.gray400, marginTop: 4 },
  providerFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  districtBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.purpleBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  districtBadgeText: { fontSize: 11, fontWeight: "800", color: colors.purple },
  mapsBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.purple, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  mapsBtnText: { fontSize: 11, fontWeight: "800", color: colors.white },
  providerDesc: { fontSize: 13, color: colors.gray600, marginTop: 8 },
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
