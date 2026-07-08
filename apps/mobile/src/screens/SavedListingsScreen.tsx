import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useT } from "@hafi/i18n";
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

export default function SavedListingsScreen() {
  const t = useT();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [ids, all] = await Promise.all([
        trpcCall<number[]>("listings.myFavoriteIds"),
        trpcCall<Listing[]>("listings.list", { limit: 50 }),
      ]);
      const saved = new Set(ids);
      setListings(all.filter((l) => saved.has(l.id)));
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const formatPrice = (p: string) => `RWF ${Number(p).toLocaleString()}`;

  if (loading) {
    return <ActivityIndicator color={colors.purple} style={{ flex: 1, marginTop: 80 }} />;
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.grid}
      data={listings}
      numColumns={2}
      keyExtractor={(item) => String(item.id)}
      columnWrapperStyle={styles.gridRow}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.purple} />
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={48} color={colors.gray400} />
          <Text style={styles.emptyTitle}>{t("marketplace.noSaved")}</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => navigation.navigate("ItemDetail", { id: item.id })}>
          <View style={styles.cardImageWrap}>
            {item.images?.[0] ? (
              <Image source={{ uri: item.images[0] }} style={styles.cardImage} contentFit="cover" />
            ) : (
              <Text style={{ fontSize: 32 }}>✨</Text>
            )}
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.purpleBg },
  grid: { padding: spacing.md },
  gridRow: { gap: spacing.sm, marginBottom: spacing.sm },
  card: { flex: 1, backgroundColor: colors.white, borderRadius: radius.xl, overflow: "hidden", paddingBottom: spacing.sm },
  cardImageWrap: { aspectRatio: 0.85, backgroundColor: "#F3E8FF", alignItems: "center", justifyContent: "center" },
  cardImage: { width: "100%", height: "100%" },
  cardTitle: { fontSize: 12, fontWeight: "600", color: colors.purpleDark, paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
  cardPrice: { fontSize: 15, fontWeight: "900", color: colors.purple, paddingHorizontal: spacing.sm },
  empty: { alignItems: "center", padding: spacing.xl * 2 },
  emptyTitle: { fontSize: 14, color: colors.gray400, marginTop: spacing.md },
});
