import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, type UserRole } from "../context/AuthContext";
import { colors, radius, spacing } from "../theme";

export default function WelcomeScreen() {
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole>("customer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+250");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (name.length < 2 || phone.length < 8) {
      setError("Enter your name and phone number");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(name.trim(), phone.trim(), role);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[colors.purpleDark, colors.purpleMid, "#4A1A8C"]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>H</Text>
          </View>
          <Text style={styles.title}>Welcome to Hafi</Text>
          <Text style={styles.subtitle}>How will you use Hafi?</Text>

          <View style={styles.roleRow}>
            <Pressable
              style={[styles.roleCard, role === "customer" && styles.roleCardActive]}
              onPress={() => setRole("customer")}
            >
              <Ionicons name="calendar" size={28} color={role === "customer" ? colors.purple : colors.gray400} />
              <Text style={[styles.roleTitle, role === "customer" && styles.roleTitleActive]}>Client</Text>
              <Text style={styles.roleDesc}>Book salons & shop</Text>
            </Pressable>
            <Pressable
              style={[styles.roleCard, role === "provider" && styles.roleCardMerchant]}
              onPress={() => setRole("provider")}
            >
              <Ionicons name="storefront" size={28} color={role === "provider" ? colors.gold : colors.gray400} />
              <Text style={[styles.roleTitle, role === "provider" && styles.roleTitleMerchant]}>Merchant</Text>
              <Text style={styles.roleDesc}>Run your business</Text>
            </Pressable>
          </View>

          <View style={styles.form}>
            <Text style={styles.demoHint}>Demo accounts — tap to fill</Text>
            <View style={styles.demoRow}>
              <Pressable
                style={styles.demoChip}
                onPress={() => {
                  setRole("customer");
                  setName("Zara Glow");
                  setPhone("+250780000002");
                }}
              >
                <Text style={styles.demoChipText}>Client: Zara</Text>
              </Pressable>
              <Pressable
                style={styles.demoChip}
                onPress={() => {
                  setRole("provider");
                  setName("Amara Beauty");
                  setPhone("+250780000001");
                }}
              >
                <Text style={styles.demoChipText}>Merchant: Amara</Text>
              </Pressable>
            </View>
            <TextInput style={styles.input} placeholder="Your name" placeholderTextColor={colors.gray400} value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="+250 7XX XXX XXX" placeholderTextColor={colors.gray400} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable onPress={handleLogin} disabled={loading}>
              <LinearGradient colors={role === "provider" ? [colors.gold, colors.goldLight] : [colors.purple, colors.purpleLight]} style={styles.cta}>
                {loading ? <ActivityIndicator color={colors.white} /> : (
                  <Text style={styles.ctaText}>{role === "provider" ? "Open Merchant App" : "Enter as Client"}</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flexGrow: 1, justifyContent: "center", padding: spacing.lg, alignItems: "center" },
  logoBox: { width: 72, height: 72, borderRadius: radius.xl, backgroundColor: colors.purpleLight, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  logoText: { fontSize: 36, fontWeight: "900", color: colors.white },
  title: { fontSize: 28, fontWeight: "900", color: colors.white, marginBottom: spacing.xs },
  subtitle: { fontSize: 15, color: "#C4B5FD", marginBottom: spacing.lg },
  roleRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg, width: "100%", maxWidth: 340 },
  roleCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: radius.xl, padding: spacing.md, alignItems: "center", borderWidth: 2, borderColor: "transparent" },
  roleCardActive: { backgroundColor: "rgba(255,255,255,0.95)", borderColor: colors.purple },
  roleCardMerchant: { backgroundColor: "rgba(255,255,255,0.95)", borderColor: colors.gold },
  roleTitle: { fontWeight: "800", color: colors.gray400, marginTop: spacing.sm, fontSize: 15 },
  roleTitleActive: { color: colors.purple },
  roleTitleMerchant: { color: colors.gold },
  roleDesc: { fontSize: 11, color: colors.gray400, marginTop: 2, textAlign: "center" },
  form: { width: "100%", maxWidth: 340, gap: spacing.sm },
  demoHint: { color: "#C4B5FD", fontSize: 12, textAlign: "center", marginBottom: 4 },
  demoRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xs },
  demoChip: { flex: 1, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: radius.lg, paddingVertical: 8, paddingHorizontal: 6, alignItems: "center" },
  demoChipText: { color: colors.white, fontSize: 11, fontWeight: "700" },
  input: { backgroundColor: "rgba(255,255,255,0.95)", borderRadius: radius.lg, padding: spacing.md, fontSize: 16, color: colors.gray800 },
  error: { color: "#FCA5A5", fontSize: 13, textAlign: "center" },
  cta: { borderRadius: radius.xl, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm },
  ctaText: { color: colors.white, fontSize: 17, fontWeight: "800" },
});
