import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { trpcCall } from "../../lib/api";
import { colors, radius, spacing } from "../../theme";

type MerchantListing = {
  id: number;
  title: string;
  price: string;
  views: number;
  likes: number;
  isBumped: boolean;
};

export default function MerchantListingsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [listings, setListings] = useState<MerchantListing[]>([]);
  const [boostingId, setBoostingId] = useState<number | null>(null);
  const [minItems, setMinItems] = useState("2");
  const [discountPercent, setDiscountPercent] = useState("10");
  const [savingBundle, setSavingBundle] = useState(false);

  useEffect(() => {
    if (user) {
      trpcCall<MerchantListing[]>("listings.list", { sellerId: user.id, limit: 50 })
        .then(setListings)
        .catch(() => {});
    }
  }, [user]);

  const boost = async (listing: MerchantListing) => {
    if (boostingId !== null) return;
    setBoostingId(listing.id);
    try {
      await trpcCall(
        "commerce.boostListing",
        { listingId: listing.id, days: 7, provider: "demo" },
        "mutation"
      );
      setListings((prev) =>
        prev.map((l) => (l.id === listing.id ? { ...l, isBumped: true } : l))
      );
      Alert.alert("Boosted! 🔥", `"${listing.title}" is featured for 7 days.`);
    } catch (e) {
      Alert.alert("Boost failed", e instanceof Error ? e.message : "Could not boost listing");
    } finally {
      setBoostingId(null);
    }
  };

  const saveBundle = async () => {
    const min = Number(minItems);
    const pct = Number(discountPercent);
    if (!Number.isInteger(min) || min < 2 || min > 10) {
      Alert.alert("Invalid bundle", "Min items must be between 2 and 10");
      return;
    }
    if (!Number.isFinite(pct) || pct < 1 || pct > 50) {
      Alert.alert("Invalid bundle", "Discount must be between 1% and 50%");
      return;
    }
    setSavingBundle(true);
    try {
      await trpcCall(
        "commerce.saveBundleRule",
        { minItems: min, discountPercent: pct },
        "mutation"
      );
      Alert.alert("Bundle saved 🎁", `Buyers get ${pct}% off when they buy ${min}+ of your items.`);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not save bundle rule");
    } finally {
      setSavingBundle(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Listings</Text>
        <Pressable onPress={() => navigation.navigate("CreateListing")} style={styles.btn}>
          <Text style={styles.btnText}>+ Sell</Text>
        </Pressable>
      </View>
      <FlatList
        data={listings}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl }}
        ListHeaderComponent={
          <View style={styles.bundleCard}>
            <View style={styles.bundleHeader}>
              <Ionicons name="gift" size={18} color={colors.purple} />
              <Text style={styles.bundleTitle}>Bundle deal</Text>
            </View>
            <Text style={styles.bundleHint}>Give a discount when buyers combine your items</Text>
            <View style={styles.bundleRow}>
              <View style={styles.bundleField}>
                <Text style={styles.bundleLabel}>Min items</Text>
                <TextInput
                  style={styles.bundleInput}
                  value={minItems}
                  onChangeText={setMinItems}
                  keyboardType="numeric"
                  placeholder="2"
                />
              </View>
              <View style={styles.bundleField}>
                <Text style={styles.bundleLabel}>Discount %</Text>
                <TextInput
                  style={styles.bundleInput}
                  value={discountPercent}
                  onChangeText={setDiscountPercent}
                  keyboardType="numeric"
                  placeholder="10"
                />
              </View>
              <Pressable
                style={[styles.bundleSave, savingBundle && { opacity: 0.6 }]}
                onPress={saveBundle}
                disabled={savingBundle}
              >
                <Text style={styles.bundleSaveText}>{savingBundle ? "Saving..." : "Save"}</Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No listings — tap + Sell</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
              {item.isBumped && (
                <View style={styles.hotBadge}>
                  <Ionicons name="flame" size={12} color={colors.white} />
                  <Text style={styles.hotText}>HOT</Text>
                </View>
              )}
            </View>
            <Text style={styles.price}>RWF {Number(item.price).toLocaleString()}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.meta}>{item.views} views · {item.likes} likes</Text>
              {item.isBumped ? (
                <View style={styles.boostedTag}>
                  <Text style={styles.boostedTagText}>Boosted</Text>
                </View>
              ) : (
                <Pressable
                  style={[styles.boostBtn, boostingId === item.id && { opacity: 0.6 }]}
                  onPress={() => boost(item)}
                  disabled={boostingId !== null}
                >
                  <Ionicons name="rocket" size={14} color={colors.white} />
                  <Text style={styles.boostBtnText}>
                    {boostingId === item.id ? "Boosting..." : "Boost 7 days"}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, paddingTop: spacing.xl },
  title: { fontSize: 26, fontWeight: "900", color: colors.purpleDark },
  btn: { backgroundColor: colors.gold, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.lg },
  btnText: { fontWeight: "800", color: colors.purpleDark },
  bundleCard: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.sm },
  bundleHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  bundleTitle: { fontWeight: "800", color: colors.purpleDark, fontSize: 15 },
  bundleHint: { fontSize: 12, color: colors.gray400, marginTop: 2, marginBottom: spacing.sm },
  bundleRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  bundleField: { flex: 1 },
  bundleLabel: { fontSize: 11, fontWeight: "700", color: colors.gray600, marginBottom: 4 },
  bundleInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.gray800,
    backgroundColor: colors.white,
  },
  bundleSave: { backgroundColor: colors.purple, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 10 },
  bundleSaveText: { color: colors.white, fontWeight: "800", fontSize: 13 },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  itemTitle: { fontWeight: "700", flex: 1 },
  hotBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.rose,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  hotText: { color: colors.white, fontSize: 10, fontWeight: "900" },
  price: { color: colors.purple, fontWeight: "900", marginTop: 4 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
  meta: { fontSize: 12, color: colors.gray400 },
  boostBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.purple,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  boostBtnText: { color: colors.white, fontWeight: "800", fontSize: 12 },
  boostedTag: { backgroundColor: "#FEF3C7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  boostedTagText: { color: colors.gold, fontWeight: "800", fontSize: 11 },
  empty: { textAlign: "center", color: colors.gray400, marginTop: 40 },
});
