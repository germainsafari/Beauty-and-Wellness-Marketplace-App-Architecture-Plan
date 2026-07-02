import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../theme";

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const DAY_COUNT = 14;

type BookingSheetProps = {
  visible: boolean;
  serviceName: string;
  /** Raw price string from the API, e.g. "15000.00". */
  price: string;
  onClose: () => void;
  /** Receives the chosen slot as a local Date. Throw to keep the sheet open. */
  onConfirm: (scheduledAt: Date) => Promise<void> | void;
};

function nextDays(count: number): Date[] {
  const days: Date[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function BookingSheet({
  visible,
  serviceName,
  price,
  onClose,
  onConfirm,
}: BookingSheetProps) {
  const days = useMemo(() => nextDays(DAY_COUNT), [visible]);
  const [dayIndex, setDayIndex] = useState(0);
  const [hour, setHour] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (hour === null || confirming) return;
    const day = days[dayIndex];
    const slot = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0, 0);
    setConfirming(true);
    setError(null);
    try {
      await onConfirm(slot);
      setDayIndex(0);
      setHour(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setConfirming(false);
    }
  };

  const close = () => {
    if (confirming) return;
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
              <Text style={styles.title}>{serviceName}</Text>
              <Text style={styles.price}>RWF {Number(price).toLocaleString()}</Text>
            </View>
            <Pressable onPress={close} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.gray600} />
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Pick a day</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {days.map((d, i) => (
              <Pressable
                key={d.toDateString()}
                style={[styles.dayChip, dayIndex === i && styles.chipActive]}
                onPress={() => setDayIndex(i)}
              >
                <Text style={[styles.dayName, dayIndex === i && styles.chipTextActive]}>
                  {d.toLocaleDateString("en-RW", { weekday: "short" })}
                </Text>
                <Text style={[styles.dayDate, dayIndex === i && styles.chipTextActive]}>
                  {d.toLocaleDateString("en-RW", { day: "numeric", month: "short" })}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.sectionLabel}>Pick a time</Text>
          <View style={styles.timeGrid}>
            {HOURS.map((h) => (
              <Pressable
                key={h}
                style={[styles.timeChip, hour === h && styles.chipActive]}
                onPress={() => setHour(h)}
              >
                <Text style={[styles.timeText, hour === h && styles.chipTextActive]}>
                  {String(h).padStart(2, "0")}:00
                </Text>
              </Pressable>
            ))}
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable onPress={confirm} disabled={hour === null || confirming}>
            <LinearGradient
              colors={
                hour === null ? [colors.gray400, colors.gray400] : [colors.purple, colors.purpleLight]
              }
              style={styles.cta}
            >
              {confirming ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.ctaText}>
                  {hour === null
                    ? "Select a time"
                    : `Confirm — ${days[dayIndex].toLocaleDateString("en-RW", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })} at ${String(hour).padStart(2, "0")}:00`}
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
  price: { fontSize: 15, fontWeight: "800", color: colors.purple, marginTop: 2 },
  closeBtn: { padding: 4 },
  sectionLabel: { fontWeight: "800", color: colors.purpleDark, marginTop: spacing.md, marginBottom: spacing.sm },
  chipRow: { gap: spacing.sm, paddingRight: spacing.md },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.purpleBg,
    alignItems: "center",
    minWidth: 68,
  },
  dayName: { fontSize: 12, fontWeight: "800", color: colors.gray600 },
  dayDate: { fontSize: 11, color: colors.gray400, marginTop: 2 },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  timeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.purpleBg },
  timeText: { fontSize: 13, fontWeight: "700", color: colors.gray600 },
  chipActive: { backgroundColor: colors.purple },
  chipTextActive: { color: colors.white },
  error: { color: colors.rose, fontSize: 13, marginTop: spacing.sm, fontWeight: "600" },
  cta: { borderRadius: radius.xl, paddingVertical: 16, alignItems: "center", marginTop: spacing.md },
  ctaText: { color: colors.white, fontWeight: "800", fontSize: 15 },
});
