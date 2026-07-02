import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { trpcCall } from "../../lib/api";
import { colors, radius, spacing } from "../../theme";

export default function MerchantListingsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [listings, setListings] = useState<any[]>([]);

  useEffect(() => {
    if (user) trpcCall<any[]>("listings.list", { sellerId: user.id, limit: 50 }).then(setListings).catch(() => {});
  }, [user]);

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
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        ListEmptyComponent={<Text style={styles.empty}>No listings — tap + Sell</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.price}>RWF {Number(item.price).toLocaleString()}</Text>
            <Text style={styles.meta}>{item.views} views · {item.likes} likes</Text>
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
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md },
  itemTitle: { fontWeight: "700" },
  price: { color: colors.purple, fontWeight: "900", marginTop: 4 },
  meta: { fontSize: 12, color: colors.gray400, marginTop: 4 },
  empty: { textAlign: "center", color: colors.gray400, marginTop: 40 },
});
