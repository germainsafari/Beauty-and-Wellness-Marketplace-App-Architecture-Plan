import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { trpcCall } from "../lib/api";
import { colors, radius, spacing } from "../theme";
import type { RootStackParamList } from "../navigation/types";

type ListingDetail = {
  id: number;
  title: string;
  description: string | null;
  price: string;
  originalPrice: string | null;
  condition: string;
  images: string[];
  location: string | null;
  isNegotiable: boolean;
  brand: string | null;
  seller: { id: number; name: string; isVerified: boolean; location: string | null; bio: string | null };
};

export default function ItemDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "ItemDetail">>();
  const [item, setItem] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [offerAmount, setOfferAmount] = useState("");
  const [showOffer, setShowOffer] = useState(false);
  const [buying, setBuying] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await trpcCall<ListingDetail>("listings.byId", { id: route.params.id });
      setItem(data);
      setOfferAmount(String(Math.round(Number(data.price) * 0.85)));
    } catch {
      Alert.alert("Error", "Could not load listing");
    } finally {
      setLoading(false);
    }
  }, [route.params.id]);

  useEffect(() => { load(); }, [load]);

  const makeOffer = async () => {
    if (!item) return;
    try {
      await trpcCall("listings.createOffer", {
        listingId: item.id,
        amount: Number(offerAmount),
        message: "Hi! I'd love to buy this 💜",
      }, "mutation");
      Alert.alert("Offer Sent! ✨", "The seller will respond in chat.");
      setShowOffer(false);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to send offer");
    }
  };

  const buyNow = async () => {
    if (!item) return;
    setBuying(true);
    try {
      const result = await trpcCall<{ payment: { status: string; externalReference: string } }>(
        "commerce.buyNow",
        { listingId: item.id, provider: "demo" },
        "mutation"
      );
      Alert.alert(
        result.payment.status === "succeeded" ? "Payment complete" : "Payment requested",
        result.payment.status === "succeeded"
          ? "The item is reserved for you with Hafi buyer protection."
          : `Reference: ${result.payment.externalReference}`
      );
    } catch (e) {
      Alert.alert("Checkout failed", e instanceof Error ? e.message : "Could not start checkout");
    } finally {
      setBuying(false);
    }
  };

  const shareListing = async () => {
    if (!item) return;
    await Share.share({
      title: item.title,
      message: `Check this Hafi listing: ${item.title} - RWF ${Number(item.price).toLocaleString()}`,
    });
  };

  if (loading || !item) {
    return <ActivityIndicator color={colors.purple} style={{ flex: 1, marginTop: 100 }} />;
  }

  const formatPrice = (p: string) => `RWF ${Number(p).toLocaleString()}`;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageWrap}>
        {item.images?.[0] ? (
          <Image source={{ uri: item.images[0] }} style={styles.image} contentFit="cover" />
        ) : (
          <Text style={{ fontSize: 64 }}>💄</Text>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.conditionRow}>
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>{item.condition.replace("_", " ").toUpperCase()}</Text>
          </View>
          {item.isNegotiable && (
            <View style={styles.negBadge}><Text style={styles.negText}>Negotiable</Text></View>
          )}
        </View>

        <Text style={styles.title}>{item.title}</Text>
        {item.brand && <Text style={styles.brand}>{item.brand}</Text>}
        <Text style={styles.price}>{formatPrice(item.price)}</Text>
        {item.originalPrice && (
          <Text style={styles.original}>{formatPrice(item.originalPrice)}</Text>
        )}

        <Pressable style={styles.shareBtn} onPress={shareListing}>
          <Ionicons name="share-social-outline" size={18} color={colors.purple} />
          <Text style={styles.shareText}>Share listing</Text>
        </Pressable>

        <View style={styles.sellerCard}>
          <View style={styles.sellerAvatar}>
            <Text style={styles.sellerInitial}>{item.seller.name[0]}</Text>
          </View>
          <View style={styles.sellerInfo}>
            <View style={styles.sellerNameRow}>
              <Text style={styles.sellerName}>{item.seller.name}</Text>
              {item.seller.isVerified && <Ionicons name="checkmark-circle" size={16} color={colors.purple} />}
            </View>
            <Text style={styles.sellerLoc}>📍 {item.seller.location || "Rwanda"}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Description</Text>
        <Text style={styles.description}>{item.description || "No description provided."}</Text>

        <View style={styles.protection}>
          <Ionicons name="shield-checkmark" size={20} color={colors.purple} />
          <Text style={styles.protectionText}>Buyer Protection — Escrow secured until delivery</Text>
        </View>

        {showOffer ? (
          <View style={styles.offerForm}>
            <Text style={styles.offerLabel}>Your Offer (RWF)</Text>
            <TextInput
              style={styles.offerInput}
              value={offerAmount}
              onChangeText={setOfferAmount}
              keyboardType="numeric"
            />
            <View style={styles.offerChips}>
              {[0.9, 0.85, 0.75].map((pct) => (
                <Pressable
                  key={pct}
                  style={styles.chip}
                  onPress={() => setOfferAmount(String(Math.round(Number(item.price) * pct)))}
                >
                  <Text style={styles.chipText}>{Math.round(pct * 100)}%</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={makeOffer}>
              <LinearGradient colors={[colors.purple, colors.purpleLight]} style={styles.cta}>
                <Text style={styles.ctaText}>Send Offer</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actions}>
            {item.isNegotiable && (
              <Pressable style={styles.secondaryBtn} onPress={() => setShowOffer(true)}>
                <Text style={styles.secondaryText}>Make Offer</Text>
              </Pressable>
            )}
            <Pressable style={{ flex: 1 }} onPress={buyNow} disabled={buying}>
              <LinearGradient colors={[colors.gold, colors.goldLight]} style={styles.cta}>
                <Text style={styles.ctaText}>{buying ? "Processing..." : "Buy Now - Escrow"}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  imageWrap: { height: 320, backgroundColor: colors.purpleBg, alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%" },
  content: { padding: spacing.md },
  conditionRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  conditionBadge: { backgroundColor: colors.purpleBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  conditionText: { fontSize: 11, fontWeight: "700", color: colors.purple },
  negBadge: { backgroundColor: "#FEF3C7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  negText: { fontSize: 11, fontWeight: "600", color: colors.gold },
  title: { fontSize: 22, fontWeight: "900", color: colors.purpleDark },
  brand: { color: colors.gray400, marginTop: 4 },
  price: { fontSize: 26, fontWeight: "900", color: colors.purple, marginTop: spacing.sm },
  original: { fontSize: 14, color: colors.gray400, textDecorationLine: "line-through" },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm, alignSelf: "flex-start", backgroundColor: colors.purpleBg, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 8 },
  shareText: { color: colors.purple, fontWeight: "700", fontSize: 12 },
  sellerCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.purpleBg, borderRadius: radius.xl, padding: spacing.md, marginTop: spacing.md, gap: spacing.md },
  sellerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.purple, alignItems: "center", justifyContent: "center" },
  sellerInitial: { color: colors.white, fontWeight: "900", fontSize: 20 },
  sellerInfo: { flex: 1 },
  sellerNameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  sellerName: { fontWeight: "700", fontSize: 15, color: colors.purpleDark },
  sellerLoc: { fontSize: 12, color: colors.gray400, marginTop: 2 },
  sectionLabel: { fontWeight: "800", color: colors.purpleDark, marginTop: spacing.lg, marginBottom: spacing.sm },
  description: { color: colors.gray600, lineHeight: 22 },
  protection: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.lg, backgroundColor: "#EDE9FE", padding: spacing.md, borderRadius: radius.lg },
  protectionText: { flex: 1, fontSize: 13, color: colors.purple, fontWeight: "600" },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.xl },
  secondaryBtn: { flex: 1, borderWidth: 2, borderColor: colors.purple, borderRadius: radius.xl, paddingVertical: 14, alignItems: "center" },
  secondaryText: { color: colors.purple, fontWeight: "800" },
  cta: { borderRadius: radius.xl, paddingVertical: 16, alignItems: "center" },
  ctaText: { color: colors.white, fontWeight: "800", fontSize: 16 },
  offerForm: { marginTop: spacing.lg, marginBottom: spacing.xl },
  offerLabel: { fontWeight: "700", color: colors.purpleDark, marginBottom: spacing.sm },
  offerInput: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: radius.lg, padding: spacing.md, fontSize: 18, fontWeight: "700" },
  offerChips: { flexDirection: "row", gap: spacing.sm, marginVertical: spacing.sm },
  chip: { backgroundColor: colors.purpleBg, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full },
  chipText: { color: colors.purple, fontWeight: "700" },
});
