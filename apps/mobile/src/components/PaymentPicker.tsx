import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../theme";

export type PaymentProvider = "demo" | "mtn_momo" | "airtel_money" | "stripe";

const OPTIONS: {
  provider: PaymentProvider;
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  needsPhone: boolean;
}[] = [
  { provider: "demo", label: "Demo instant", hint: "Succeeds immediately (test mode)", icon: "flash", needsPhone: false },
  { provider: "mtn_momo", label: "MTN MoMo", hint: "Approve on your phone", icon: "phone-portrait", needsPhone: true },
  { provider: "airtel_money", label: "Airtel Money", hint: "Approve on your phone", icon: "phone-portrait-outline", needsPhone: true },
  { provider: "stripe", label: "Card (Stripe)", hint: "Visa / Mastercard", icon: "card", needsPhone: false },
];

type PaymentPickerProps = {
  visible: boolean;
  /** Sheet heading, e.g. "Buy Now — Escrow". */
  title: string;
  /** Amount line shown under the heading, e.g. "RWF 15,000". */
  amountLabel?: string;
  onClose: () => void;
  /**
   * Runs the payment. Throw to keep the sheet open and show the message
   * inline; resolve to close the sheet.
   */
  onConfirm: (provider: PaymentProvider, phone?: string) => Promise<void> | void;
};

export default function PaymentPicker({
  visible,
  title,
  amountLabel,
  onClose,
  onConfirm,
}: PaymentPickerProps) {
  const [provider, setProvider] = useState<PaymentProvider>("demo");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = OPTIONS.find((o) => o.provider === provider)!;
  const phoneMissing = selected.needsPhone && phone.trim().length < 10;

  const confirm = async () => {
    if (submitting || phoneMissing) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(provider, selected.needsPhone ? phone.trim() : undefined);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    if (submitting) return;
    setError(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouch} onPress={close} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              {amountLabel && <Text style={styles.amount}>{amountLabel}</Text>}
            </View>
            <Pressable onPress={close} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.gray600} />
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Pay with</Text>
          {OPTIONS.map((o) => (
            <Pressable
              key={o.provider}
              style={[styles.option, provider === o.provider && styles.optionActive]}
              onPress={() => { setProvider(o.provider); setError(null); }}
            >
              <View style={[styles.optionIcon, provider === o.provider && styles.optionIconActive]}>
                <Ionicons
                  name={o.icon}
                  size={18}
                  color={provider === o.provider ? colors.white : colors.purple}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionLabel}>{o.label}</Text>
                <Text style={styles.optionHint}>{o.hint}</Text>
              </View>
              <Ionicons
                name={provider === o.provider ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={provider === o.provider ? colors.purple : colors.gray400}
              />
            </Pressable>
          ))}

          {selected.needsPhone && (
            <View style={styles.phoneWrap}>
              <Text style={styles.phoneLabel}>Mobile money number</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="+2507XXXXXXXX"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
            </View>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable onPress={confirm} disabled={submitting || phoneMissing}>
            <LinearGradient
              colors={
                phoneMissing ? [colors.gray400, colors.gray400] : [colors.purple, colors.purpleLight]
              }
              style={styles.cta}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.ctaText}>
                  {phoneMissing ? "Enter your number" : `Pay with ${selected.label}`}
                </Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(26,5,51,0.5)", justifyContent: "flex-end" },
  backdropTouch: { flex: 1 },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.gray100, alignSelf: "center", marginBottom: spacing.md },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  title: { fontSize: 18, fontWeight: "900", color: colors.purpleDark },
  amount: { fontSize: 15, fontWeight: "800", color: colors.purple, marginTop: 2 },
  closeBtn: { padding: 4 },
  sectionLabel: { fontWeight: "800", color: colors.purpleDark, marginTop: spacing.md, marginBottom: spacing.sm },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.purpleBg,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionActive: { borderColor: colors.purple, backgroundColor: colors.white },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconActive: { backgroundColor: colors.purple },
  optionLabel: { fontWeight: "800", color: colors.purpleDark, fontSize: 14 },
  optionHint: { fontSize: 11, color: colors.gray400, marginTop: 2 },
  phoneWrap: { marginTop: spacing.xs },
  phoneLabel: { fontWeight: "700", color: colors.purpleDark, marginBottom: spacing.sm, fontSize: 13 },
  phoneInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: 15,
    color: colors.gray800,
  },
  error: { color: colors.rose, fontSize: 13, marginTop: spacing.sm, fontWeight: "600" },
  cta: { borderRadius: radius.xl, paddingVertical: 16, alignItems: "center", marginTop: spacing.md },
  ctaText: { color: colors.white, fontWeight: "800", fontSize: 15 },
});
