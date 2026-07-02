import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import BookingSheet from "../components/BookingSheet";
import { trpcCall } from "../lib/api";
import { colors, radius, spacing } from "../theme";

type Service = {
  service: { id: number; name: string; description: string | null; duration: number; price: string };
  provider: { businessName: string; rating: string; address: string };
  category: { name: string; icon: string | null } | null;
};

type Booking = {
  id: number;
  serviceName: string;
  providerName: string;
  scheduledAt: string;
  status: string;
  totalAmount: string;
};

export default function BookingsScreen() {
  const [tab, setTab] = useState<"book" | "mine">("book");
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingService, setBookingService] = useState<Service | null>(null);

  const load = useCallback(async () => {
    try {
      const [svc, bkg] = await Promise.all([
        trpcCall<Service[]>("bookings.services"),
        trpcCall<Booking[]>("bookings.mine"),
      ]);
      setServices(svc);
      setBookings(bkg);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const confirmBooking = async (scheduledAt: Date) => {
    if (!bookingService) return;
    // Errors propagate to BookingSheet, which shows them inline.
    await trpcCall("bookings.create", {
      serviceId: bookingService.service.id,
      scheduledAt: scheduledAt.toISOString(),
      notes: "Booked via Hafi app",
    }, "mutation");
    const name = bookingService.service.name;
    setBookingService(null);
    Alert.alert("Booked! ✨", `Your ${name} appointment is pending confirmation.`);
    setTab("mine");
    load();
  };

  const formatPrice = (p: string) => `RWF ${Number(p).toLocaleString()}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bookings</Text>
        <Text style={styles.subtitle}>Book electricians, mechanics, salons, cleaners, and more</Text>
        <View style={styles.tabs}>
          {(["book", "mine"] as const).map((t) => (
            <Pressable
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === "book" ? "Discover" : "My Bookings"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.purple} style={{ marginTop: 40 }} />
      ) : tab === "book" ? (
        <FlatList
          data={services}
          keyExtractor={(item) => String(item.service.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.purple} />}
          renderItem={({ item }) => (
            <View style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceEmoji}>{item.category?.icon || "✨"}</Text>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{item.service.name}</Text>
                  <Text style={styles.providerName}>{item.provider.businessName}</Text>
                  <Text style={styles.providerMeta}>
                    ⭐ {item.provider.rating} · {item.service.duration} min · 📍 {item.provider.address}
                  </Text>
                </View>
              </View>
              {item.service.description && (
                <Text style={styles.serviceDesc} numberOfLines={2}>{item.service.description}</Text>
              )}
              <View style={styles.serviceFooter}>
                <Text style={styles.servicePrice}>{formatPrice(item.service.price)}</Text>
                <Pressable onPress={() => setBookingService(item)}>
                  <LinearGradient colors={[colors.purple, colors.purpleLight]} style={styles.bookBtn}>
                    <Text style={styles.bookBtnText}>Book Now</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color={colors.gray400} />
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptyDesc}>Discover trusted services near you</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.bookingCard}>
              <View style={styles.bookingIcon}>
                <Ionicons name="sparkles" size={24} color={colors.purple} />
              </View>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingService}>{item.serviceName}</Text>
                <Text style={styles.bookingProvider}>{item.providerName}</Text>
                <Text style={styles.bookingDate}>
                  {new Date(item.scheduledAt).toLocaleDateString("en-RW", {
                    weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </Text>
              </View>
              <View style={[styles.statusBadge, item.status === "confirmed" && styles.statusConfirmed]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
          )}
        />
      )}

      <BookingSheet
        visible={bookingService !== null}
        serviceName={bookingService?.service.name ?? ""}
        price={bookingService?.service.price ?? "0"}
        onClose={() => setBookingService(null)}
        onConfirm={confirmBooking}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.purpleBg },
  header: { backgroundColor: colors.white, padding: spacing.md, paddingTop: spacing.lg, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  title: { fontSize: 26, fontWeight: "900", color: colors.purpleDark },
  subtitle: { color: colors.gray400, marginBottom: spacing.md },
  tabs: { flexDirection: "row", backgroundColor: colors.purpleBg, borderRadius: radius.lg, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: radius.md },
  tabActive: { backgroundColor: colors.white },
  tabText: { fontWeight: "600", color: colors.gray400 },
  tabTextActive: { color: colors.purple, fontWeight: "800" },
  list: { padding: spacing.md, gap: spacing.sm },
  serviceCard: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.sm },
  serviceHeader: { flexDirection: "row", gap: spacing.md },
  serviceEmoji: { fontSize: 32 },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 16, fontWeight: "800", color: colors.purpleDark },
  providerName: { fontSize: 13, color: colors.purple, fontWeight: "600", marginTop: 2 },
  providerMeta: { fontSize: 11, color: colors.gray400, marginTop: 4 },
  serviceDesc: { color: colors.gray600, fontSize: 13, marginTop: spacing.sm, lineHeight: 20 },
  serviceFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.md },
  servicePrice: { fontSize: 18, fontWeight: "900", color: colors.purple },
  bookBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.lg },
  bookBtnText: { color: colors.white, fontWeight: "800" },
  bookingCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md },
  bookingIcon: { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.purpleBg, alignItems: "center", justifyContent: "center" },
  bookingInfo: { flex: 1 },
  bookingService: { fontWeight: "700", color: colors.purpleDark },
  bookingProvider: { fontSize: 12, color: colors.gray400, marginTop: 2 },
  bookingDate: { fontSize: 12, color: colors.purple, marginTop: 4, fontWeight: "600" },
  statusBadge: { backgroundColor: "#FEF3C7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  statusConfirmed: { backgroundColor: "#D1FAE5" },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  empty: { alignItems: "center", padding: spacing.xl * 2 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.gray600, marginTop: spacing.md },
  emptyDesc: { fontSize: 13, color: colors.gray400, marginTop: spacing.sm },
});
