import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { trpcCall } from "../lib/api";
import { colors, radius, spacing } from "../theme";
import type { RootStackParamList } from "../navigation/types";

type Listing = {
  id: number;
  title: string;
  price: string;
  condition: string;
  images: string[];
  location: string | null;
  isBumped: boolean;
  likes: number;
};

const FILTERS = ["All", "Trending", "New", "Near Me"];

export default function MarketplaceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const items = await trpcCall<Listing[]>("listings.list", {
        search: search || undefined,
        limit: 30,
      });
      let sorted = [...items];
      if (filter === "Trending") sorted.sort((a, b) => b.likes - a.likes);
      if (filter === "New") sorted = sorted.filter((i) => i.isBumped || true);
      setListings(sorted);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, filter]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const formatPrice = (p: string) => `RWF ${Number(p).toLocaleString()}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace</Text>
        <Text style={styles.subtitle}>Pre-loved beauty gems 💎</Text>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search makeup, skincare, tools..."
            placeholderTextColor={colors.gray400}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(i) => i}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.filterPill, filter === item && styles.filterActive]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
            </Pressable>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.purple} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={listings}
          numColumns={2}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.purple} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>🛍️</Text>
              <Text style={styles.emptyTitle}>No listings found</Text>
              <Text style={styles.emptyDesc}>Try a different search or be the first to sell!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate("ItemDetail", { id: item.id })}
            >
              <View style={styles.cardImageWrap}>
                {item.images?.[0] ? (
                  <Image source={{ uri: item.images[0] }} style={styles.cardImage} contentFit="cover" />
                ) : (
                  <Text style={{ fontSize: 32 }}>✨</Text>
                )}
                {item.condition === "new" && (
                  <View style={styles.newBadge}><Text style={styles.badgeText}>NEW</Text></View>
                )}
                {item.isBumped && (
                  <View style={styles.hotBadge}><Text style={styles.badgeText}>🔥</Text></View>
                )}
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
              <Text style={styles.cardLoc} numberOfLines={1}>📍 {item.location || "Rwanda"}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.purpleBg },
  header: { backgroundColor: colors.white, padding: spacing.md, paddingTop: spacing.lg, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  title: { fontSize: 26, fontWeight: "900", color: colors.purpleDark },
  subtitle: { color: colors.gray400, marginBottom: spacing.md },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.purpleBg,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.gray800 },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.purpleBg,
    marginRight: spacing.sm,
    marginTop: spacing.sm,
  },
  filterActive: { backgroundColor: colors.purple },
  filterText: { fontSize: 13, fontWeight: "600", color: colors.gray600 },
  filterTextActive: { color: colors.white },
  grid: { padding: spacing.md },
  gridRow: { gap: spacing.sm, marginBottom: spacing.sm },
  card: { flex: 1, backgroundColor: colors.white, borderRadius: radius.xl, overflow: "hidden", paddingBottom: spacing.sm },
  cardImageWrap: { aspectRatio: 0.85, backgroundColor: "#F3E8FF", alignItems: "center", justifyContent: "center" },
  cardImage: { width: "100%", height: "100%" },
  newBadge: { position: "absolute", top: 8, left: 8, backgroundColor: colors.emerald, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  hotBadge: { position: "absolute", top: 8, right: 8, backgroundColor: colors.gold, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: "800" },
  cardTitle: { fontSize: 12, fontWeight: "600", color: colors.purpleDark, paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
  cardPrice: { fontSize: 15, fontWeight: "900", color: colors.purple, paddingHorizontal: spacing.sm },
  cardLoc: { fontSize: 10, color: colors.gray400, paddingHorizontal: spacing.sm },
  empty: { alignItems: "center", padding: spacing.xl * 2 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.gray600, marginTop: spacing.md },
  emptyDesc: { fontSize: 13, color: colors.gray400, marginTop: spacing.sm },
});
