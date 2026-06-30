import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
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
};

const CATEGORIES = [
  { label: "Hair", emoji: "💇‍♀️" },
  { label: "Skincare", emoji: "✨" },
  { label: "Makeup", emoji: "💄" },
  { label: "Nails", emoji: "💅" },
  { label: "Lashes", emoji: "👁️" },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [wallet, setWallet] = useState({ balance: "0", loyaltyPoints: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [items, bal] = await Promise.all([
        trpcCall<Listing[]>("listings.list", { limit: 6 }),
        trpcCall<{ balance: string; loyaltyPoints: number }>("wallet.balance"),
      ]);
      setListings(items);
      setWallet(bal);
    } catch {
      /* offline fallback */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const formatPrice = (p: string) => `RWF ${Number(p).toLocaleString()}`;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.purple} />}
    >
      <LinearGradient colors={[colors.purpleBg, colors.white]} style={styles.header}>
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>Good day 👋</Text>
            <Text style={styles.name}>{user?.name?.split(" ")[0] || "Beauty Lover"}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name?.[0] || "H").toUpperCase()}</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.purple, colors.purpleLight]} style={styles.loyaltyCard}>
          <Ionicons name="gift" size={28} color={colors.white} />
          <View style={styles.loyaltyInfo}>
            <Text style={styles.loyaltyLabel}>Hafi Loyalty Points</Text>
            <Text style={styles.loyaltyPts}>{wallet.loyaltyPoints.toLocaleString()} pts</Text>
          </View>
          <View>
            <Text style={styles.walletLabel}>Wallet</Text>
            <Text style={styles.walletVal}>{formatPrice(wallet.balance)}</Text>
          </View>
        </LinearGradient>
      </LinearGradient>

      <View style={styles.quickActions}>
        {[
          { label: "Book", icon: "calendar" as const, screen: "Bookings" as const, bg: "#EDE9FE" },
          { label: "Shop", icon: "bag-handle" as const, screen: "Marketplace" as const, bg: "#FEF3C7" },
          { label: "Sell", icon: "pricetag" as const, screen: "CreateListing" as const, bg: "#D1FAE5" },
          { label: "AI", icon: "sparkles" as const, screen: "AI" as const, bg: "#FCE7F3" },
        ].map((a) => (
          <Pressable
            key={a.label}
            style={styles.actionBtn}
            onPress={() => {
              if (a.screen === "CreateListing") navigation.navigate("CreateListing");
              else if (a.screen === "AI") navigation.navigate("Main", { screen: "AI" });
              else navigation.navigate("Main", { screen: a.screen });
            }}
          >
            <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
              <Ionicons name={a.icon} size={22} color={colors.purple} />
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Browse Categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c.label}
            style={styles.catPill}
            onPress={() => navigation.navigate("Main", { screen: "Marketplace" })}
          >
            <Text style={styles.catEmoji}>{c.emoji}</Text>
            <Text style={styles.catLabel}>{c.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Trending Now 🔥</Text>
        <Pressable onPress={() => navigation.navigate("Main", { screen: "Marketplace" })}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.purple} style={{ marginVertical: 40 }} />
      ) : (
        <FlatList
          data={listings}
          numColumns={2}
          scrollEnabled={false}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate("ItemDetail", { id: item.id })}
            >
              <View style={styles.cardImageWrap}>
                {item.images?.[0] ? (
                  <Image source={{ uri: item.images[0] }} style={styles.cardImage} contentFit="cover" />
                ) : (
                  <Text style={{ fontSize: 32 }}>🛍️</Text>
                )}
                {item.isBumped && (
                  <View style={styles.bumpBadge}>
                    <Text style={styles.bumpText}>HOT</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
            </Pressable>
          )}
        />
      )}

      <LinearGradient colors={[colors.purpleDark, colors.purpleMid]} style={styles.promise}>
        <Text style={styles.promiseTitle}>⭐ The Hafi Promise</Text>
        <View style={styles.promiseRow}>
          {[
            { icon: "🔒", label: "Secure Payments" },
            { icon: "✅", label: "Verified Sellers" },
            { icon: "🔄", label: "Easy Returns" },
          ].map((p) => (
            <View key={p.label} style={styles.promiseItem}>
              <Text style={{ fontSize: 24 }}>{p.icon}</Text>
              <Text style={styles.promiseLabel}>{p.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.purpleBg },
  header: { padding: spacing.md, paddingTop: spacing.lg },
  greetingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  greeting: { color: colors.gray400, fontSize: 14 },
  name: { fontSize: 24, fontWeight: "900", color: colors.purpleDark },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.white, fontWeight: "900", fontSize: 18 },
  loyaltyCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.xl,
    gap: spacing.md,
  },
  loyaltyInfo: { flex: 1 },
  loyaltyLabel: { color: "#DDD6FE", fontSize: 12 },
  loyaltyPts: { color: colors.white, fontSize: 22, fontWeight: "900" },
  walletLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11, textAlign: "right" },
  walletVal: { color: colors.white, fontWeight: "700", fontSize: 14 },
  quickActions: { flexDirection: "row", padding: spacing.md, gap: spacing.sm },
  actionBtn: { flex: 1, alignItems: "center", backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.sm },
  actionIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  actionLabel: { fontSize: 11, fontWeight: "600", color: colors.purpleDark },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: colors.purpleDark, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingRight: spacing.md },
  seeAll: { color: colors.purple, fontWeight: "600", fontSize: 13 },
  catScroll: { paddingHorizontal: spacing.md, marginBottom: spacing.md },
  catPill: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  catEmoji: { fontSize: 24 },
  catLabel: { fontSize: 11, fontWeight: "600", color: colors.purpleDark, marginTop: 4 },
  grid: { paddingHorizontal: spacing.md },
  gridRow: { gap: spacing.sm, marginBottom: spacing.sm },
  card: { flex: 1, backgroundColor: colors.white, borderRadius: radius.xl, overflow: "hidden" },
  cardImageWrap: {
    aspectRatio: 1,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  cardImage: { width: "100%", height: "100%" },
  bumpBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  bumpText: { color: colors.white, fontSize: 10, fontWeight: "800" },
  cardTitle: { fontSize: 12, fontWeight: "600", color: colors.purpleDark, padding: spacing.sm, paddingBottom: 0 },
  cardPrice: { fontSize: 14, fontWeight: "900", color: colors.purple, padding: spacing.sm, paddingTop: 4 },
  promise: { margin: spacing.md, borderRadius: radius.xl, padding: spacing.lg },
  promiseTitle: { color: colors.white, fontWeight: "900", fontSize: 16, marginBottom: spacing.md },
  promiseRow: { flexDirection: "row", justifyContent: "space-around" },
  promiseItem: { alignItems: "center" },
  promiseLabel: { color: colors.white, fontSize: 11, fontWeight: "600", marginTop: 4, textAlign: "center" },
});
