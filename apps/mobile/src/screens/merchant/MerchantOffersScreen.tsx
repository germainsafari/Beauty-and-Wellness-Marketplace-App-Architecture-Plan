import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useT } from "@hafi/i18n";
import { trpcCall } from "../../lib/api";
import { colors, radius, spacing } from "../../theme";

type Offer = {
  id: number;
  amount: string;
  status: string;
  message: string | null;
  counterAmount: string | null;
  listing: { id: number; title: string; price: string };
  buyer: { id: number; name: string };
};

export default function MerchantOffersScreen() {
  const t = useT();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [counterFor, setCounterFor] = useState<number | null>(null);
  const [counterAmount, setCounterAmount] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    trpcCall<Offer[]>("merchant.offers")
      .then(setOffers)
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const formatPrice = (p: string) => `RWF ${Number(p).toLocaleString()}`;

  const respond = async (offerId: number, action: "accept" | "decline" | "counter", amount?: number) => {
    setActing(offerId);
    try {
      await trpcCall("merchant.respondToOffer", { offerId, action, counterAmount: amount }, "mutation");
      setCounterFor(null);
      load();
    } catch (e) {
      Alert.alert(t("common.loading"), e instanceof Error ? e.message : "Failed");
    } finally {
      setActing(null);
    }
  };

  const pending = offers.filter((o) => o.status === "pending");
  const resolved = offers.filter((o) => o.status !== "pending");

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: spacing.md }]}
    >
      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
      ) : offers.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t("merchant.offersEmpty")}</Text>
        </View>
      ) : (
        <>
          {pending.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("merchant.offersPending")} ({pending.length})</Text>
              {pending.map((o) => (
                <OfferCard
                  key={o.id}
                  offer={o}
                  acting={acting === o.id}
                  counterFor={counterFor}
                  counterAmount={counterAmount}
                  formatPrice={formatPrice}
                  onCounterAmountChange={setCounterAmount}
                  onShowCounter={() => {
                    setCounterFor(o.id);
                    setCounterAmount(String(Math.round(Number(o.listing.price) * 0.9)));
                  }}
                  onCancelCounter={() => setCounterFor(null)}
                  onAccept={() => respond(o.id, "accept")}
                  onDecline={() => respond(o.id, "decline")}
                  onSendCounter={() => respond(o.id, "counter", Number(counterAmount))}
                />
              ))}
            </View>
          )}
          {resolved.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("merchant.offersResolved")}</Text>
              {resolved.map((o) => (
                <View key={o.id} style={[styles.card, styles.cardMuted]}>
                  <Text style={styles.listingTitle}>{o.listing.title}</Text>
                  <Text style={styles.buyer}>{o.buyer.name}</Text>
                  <Text style={styles.amount}>{formatPrice(o.amount)}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                      {o.status}
                      {o.counterAmount ? ` · ${formatPrice(o.counterAmount)}` : ""}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function OfferCard({
  offer,
  acting,
  counterFor,
  counterAmount,
  formatPrice,
  onCounterAmountChange,
  onShowCounter,
  onCancelCounter,
  onAccept,
  onDecline,
  onSendCounter,
}: {
  offer: Offer;
  acting: boolean;
  counterFor: number | null;
  counterAmount: string;
  formatPrice: (p: string) => string;
  onCounterAmountChange: (v: string) => void;
  onShowCounter: () => void;
  onCancelCounter: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onSendCounter: () => void;
}) {
  const t = useT();
  const isCountering = counterFor === offer.id;

  return (
    <View style={styles.card}>
      <Text style={styles.listingTitle}>{offer.listing.title}</Text>
      <Text style={styles.buyer}>
        {offer.buyer.name} · {formatPrice(offer.listing.price)}
      </Text>
      <Text style={styles.amount}>{formatPrice(offer.amount)}</Text>
      {offer.message ? <Text style={styles.message}>"{offer.message}"</Text> : null}

      {isCountering ? (
        <View style={styles.counterForm}>
          <TextInput
            style={styles.counterInput}
            value={counterAmount}
            onChangeText={onCounterAmountChange}
            keyboardType="numeric"
            placeholder="RWF"
          />
          <Pressable style={styles.primaryBtn} onPress={onSendCounter} disabled={acting}>
            <Text style={styles.primaryBtnText}>{t("merchant.sendCounter")}</Text>
          </Pressable>
          <Pressable onPress={onCancelCounter}>
            <Text style={styles.cancelText}>{t("common.cancel")}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable style={[styles.actionBtn, styles.acceptBtn]} onPress={onAccept} disabled={acting}>
            <Text style={styles.acceptText}>{t("merchant.acceptOffer")}</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={onShowCounter} disabled={acting}>
            <Text style={styles.actionText}>{t("merchant.counterOffer")}</Text>
          </Pressable>
          <Pressable onPress={onDecline} disabled={acting}>
            <Text style={styles.declineText}>{t("merchant.declineOffer")}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  empty: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.xl * 2, alignItems: "center" },
  emptyTitle: { color: colors.gray400, fontSize: 14 },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.gray600, marginBottom: spacing.sm },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.sm },
  cardMuted: { opacity: 0.75 },
  listingTitle: { fontSize: 16, fontWeight: "800", color: colors.purpleDark },
  buyer: { fontSize: 13, color: colors.gray400, marginTop: 4 },
  amount: { fontSize: 22, fontWeight: "900", color: colors.purple, marginTop: spacing.sm },
  message: { fontSize: 13, color: colors.gray600, fontStyle: "italic", marginTop: spacing.sm },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md, alignItems: "center" },
  actionBtn: { borderWidth: 1, borderColor: colors.gray100, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 8 },
  acceptBtn: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  acceptText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  actionText: { fontWeight: "700", fontSize: 13, color: colors.purpleDark },
  declineText: { color: colors.rose, fontWeight: "700", fontSize: 13, paddingHorizontal: 8 },
  counterForm: { marginTop: spacing.md, gap: spacing.sm },
  counterInput: { borderWidth: 1, borderColor: colors.gray100, borderRadius: radius.lg, padding: spacing.md, fontSize: 16, fontWeight: "700" },
  primaryBtn: { backgroundColor: colors.purple, borderRadius: radius.lg, paddingVertical: 12, alignItems: "center" },
  primaryBtnText: { color: colors.white, fontWeight: "700" },
  cancelText: { textAlign: "center", color: colors.gray400, fontSize: 13 },
  statusBadge: { marginTop: spacing.sm, alignSelf: "flex-start", backgroundColor: colors.gray100, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize", color: colors.gray600 },
});
