import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { trpcCall } from "../../lib/api";
import { colors, radius, spacing } from "../../theme";

export default function MerchantCalendarScreen() {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    trpcCall("merchant.calendar").then(setBookings).catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendar</Text>
      <FlatList
        data={bookings}
        keyExtractor={(b) => String(b.id)}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        ListEmptyComponent={<Text style={styles.empty}>No appointments</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.service}>{item.serviceName}</Text>
            {item.customerName ? <Text style={styles.customer}>{item.customerName}</Text> : null}
            <Text style={styles.date}>{new Date(item.scheduledAt).toLocaleString()}</Text>
            <View style={styles.row}>
              <Text style={styles.status}>{item.status}</Text>
              {item.status === "pending" && (
                <Pressable onPress={() => trpcCall("merchant.updateBookingStatus", { id: item.id, status: "confirmed" }, "mutation").then(() => trpcCall("merchant.calendar").then(setBookings))}>
                  <Text style={styles.confirm}>Confirm</Text>
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
  title: { fontSize: 26, fontWeight: "900", padding: spacing.md, paddingTop: spacing.xl, color: colors.purpleDark },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md },
  service: { fontWeight: "800", fontSize: 16 },
  customer: { color: colors.gray600, fontSize: 13, marginTop: 2 },
  date: { color: colors.purple, marginTop: 4, fontWeight: "600" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
  status: { textTransform: "capitalize", fontSize: 12, fontWeight: "700", color: colors.gray600 },
  confirm: { color: colors.emerald, fontWeight: "800" },
  empty: { textAlign: "center", color: colors.gray400, marginTop: 40 },
});
