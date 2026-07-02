import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ImageBackground,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
import { DEMO_ACCOUNTS, ONBOARDING_SLIDES } from "../lib/onboarding";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useT } from "@hafi/i18n";
import { colors, radius, spacing } from "../theme";

const { width: SCREEN_W } = Dimensions.get("window");

export default function WelcomeScreen() {
  const { login, signIn } = useAuth();
  const t = useT();
  const [slideIndex, setSlideIndex] = useState(0);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<UserRole>("customer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+250");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const slideRef = useRef<FlatList>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((i) => {
        const next = (i + 1) % ONBOARDING_SLIDES.length;
        slideRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const onSlideScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (i !== slideIndex) setSlideIndex(i);
  };

  const submit = async () => {
    if (phone.length < 8 || (mode === "signup" && name.length < 2)) {
      setError(mode === "signin" ? "Enter your phone number" : "Enter your name and phone");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (mode === "signin") await signIn(phone.trim());
      else await login(name.trim(), phone.trim(), role);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const demoSignIn = async (demoPhone: string) => {
    setLoading(true);
    setError("");
    try {
      await signIn(demoPhone);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <FlatList
        ref={slideRef}
        data={ONBOARDING_SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onSlideScroll}
        keyExtractor={(item) => item.id}
        style={styles.carousel}
        renderItem={({ item }) => (
          <ImageBackground source={{ uri: item.image }} style={styles.slide} resizeMode="cover">
            <LinearGradient colors={["transparent", "rgba(26,5,51,0.85)", colors.purpleDark]} style={styles.slideGradient}>
              <View style={styles.logoRow}>
                <View style={styles.logoBox}>
                  <Text style={styles.logoText}>H</Text>
                </View>
                <Text style={styles.logoLabel}>Hafi</Text>
              </View>
              <Text style={styles.slideTitle}>{t(item.titleKey)}</Text>
              <Text style={styles.slideSub}>{t(item.subtitleKey)}</Text>
            </LinearGradient>
          </ImageBackground>
        )}
      />
      <View style={styles.dots}>
        {ONBOARDING_SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === slideIndex && styles.dotActive]} />
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.sheetInner} keyboardShouldPersistTaps="handled">
          <View style={styles.modeRow}>
            <Pressable style={[styles.modeBtn, mode === "signin" && styles.modeBtnActive]} onPress={() => setMode("signin")}>
              <Text style={[styles.modeText, mode === "signin" && styles.modeTextActive]}>{t("common.signIn")}</Text>
            </Pressable>
            <Pressable style={[styles.modeBtn, mode === "signup" && styles.modeBtnActive]} onPress={() => setMode("signup")}>
              <Text style={[styles.modeText, mode === "signup" && styles.modeTextActive]}>{t("common.createAccount")}</Text>
            </Pressable>
          </View>

          {mode === "signup" && (
            <View style={styles.roleRow}>
              <Pressable style={[styles.roleCard, role === "customer" && styles.roleCardActive]} onPress={() => setRole("customer")}>
                <Ionicons name="calendar" size={24} color={role === "customer" ? colors.purple : colors.gray400} />
                <Text style={[styles.roleTitle, role === "customer" && styles.roleTitleActive]}>{t("common.client")}</Text>
              </Pressable>
              <Pressable style={[styles.roleCard, role === "provider" && styles.roleCardMerchant]} onPress={() => setRole("provider")}>
                <Ionicons name="storefront" size={24} color={role === "provider" ? colors.gold : colors.gray400} />
                <Text style={[styles.roleTitle, role === "provider" && styles.roleTitleMerchant]}>{t("common.merchant")}</Text>
              </Pressable>
            </View>
          )}

          <LanguageSwitcher />

          {mode === "signin" && (
            <>
              <Text style={styles.demoHint}>{t("auth.demoTap")}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.demoScroll}>
                {DEMO_ACCOUNTS.map((d) => (
                  <Pressable key={d.phone} style={styles.demoChip} onPress={() => demoSignIn(d.phone)}>
                    <Text style={styles.demoChipLabel}>{d.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}

          {mode === "signup" && (
            <TextInput style={styles.input} placeholder={t("auth.namePlaceholder")} placeholderTextColor={colors.gray400} value={name} onChangeText={setName} />
          )}
          <TextInput
            style={styles.input}
            placeholder={t("auth.phonePlaceholder")}
            placeholderTextColor={colors.gray400}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable onPress={submit} disabled={loading}>
            <LinearGradient
              colors={role === "provider" && mode === "signup" ? [colors.gold, colors.goldLight] : [colors.purple, colors.purpleLight]}
              style={styles.cta}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.ctaText}>{mode === "signin" ? t("common.signIn") : t("common.createAccount")}</Text>
              )}
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const SLIDE_H = 280;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.purpleDark },
  carousel: { maxHeight: SLIDE_H },
  slide: { width: SCREEN_W, height: SLIDE_H },
  slideGradient: { flex: 1, justifyContent: "flex-end", padding: spacing.lg, paddingBottom: spacing.xl },
  logoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  logoBox: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: 20, fontWeight: "900", color: colors.white },
  logoLabel: { color: colors.white, fontWeight: "800", fontSize: 16 },
  slideTitle: { fontSize: 26, fontWeight: "900", color: colors.white, lineHeight: 30 },
  slideSub: { fontSize: 14, color: "#DDD6FE", marginTop: spacing.sm, lineHeight: 20 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: spacing.sm, backgroundColor: colors.purpleDark },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.35)" },
  dotActive: { width: 20, backgroundColor: colors.white },
  sheet: { flex: 1, backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -12 },
  sheetInner: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  modeRow: { flexDirection: "row", backgroundColor: colors.purpleBg, borderRadius: radius.xl, padding: 4, marginBottom: spacing.md },
  modeBtn: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: radius.lg },
  modeBtnActive: { backgroundColor: colors.white },
  modeText: { color: colors.gray400, fontWeight: "800" },
  modeTextActive: { color: colors.purple },
  roleRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  roleCard: { flex: 1, backgroundColor: colors.purpleBg, borderRadius: radius.xl, padding: spacing.md, alignItems: "center", borderWidth: 2, borderColor: "transparent" },
  roleCardActive: { borderColor: colors.purple, backgroundColor: "#F5F3FF" },
  roleCardMerchant: { borderColor: colors.gold, backgroundColor: "#FFFBEB" },
  roleTitle: { fontWeight: "800", color: colors.gray400, marginTop: 6, fontSize: 14 },
  roleTitleActive: { color: colors.purple },
  roleTitleMerchant: { color: colors.gold },
  demoHint: { color: colors.gray400, fontSize: 12, marginBottom: spacing.xs },
  demoScroll: { marginBottom: spacing.sm, maxHeight: 44 },
  demoChip: { backgroundColor: colors.purpleBg, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 8, marginRight: spacing.sm },
  demoChipLabel: { color: colors.purple, fontWeight: "700", fontSize: 12 },
  input: { backgroundColor: colors.purpleBg, borderRadius: radius.lg, padding: spacing.md, fontSize: 16, color: colors.gray800, marginBottom: spacing.sm },
  error: { color: colors.rose, fontSize: 13, textAlign: "center", marginBottom: spacing.sm },
  cta: { borderRadius: radius.xl, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm },
  ctaText: { color: colors.white, fontSize: 17, fontWeight: "800" },
});
