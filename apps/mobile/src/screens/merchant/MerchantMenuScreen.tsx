import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useT } from "@hafi/i18n";
import { colors, radius, spacing } from "../../theme";
import type { RootStackParamList } from "../../navigation/types";

type NavItem = {
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
  tab?: keyof import("../../navigation/types").MerchantTabParamList;
  stack?: keyof RootStackParamList;
};

const MAIN_NAV: NavItem[] = [
  { icon: "storefront-outline", labelKey: "merchant.nav.dashboard", tab: "Dashboard" },
  { icon: "calendar-outline", labelKey: "merchant.nav.calendar", tab: "Calendar" },
  { icon: "briefcase-outline", labelKey: "merchant.nav.services", tab: "Services" },
  { icon: "pricetags-outline", labelKey: "merchant.nav.listings", tab: "Listings" },
  { icon: "mail-outline", labelKey: "merchant.nav.offers", stack: "MerchantOffers" },
  { icon: "bar-chart-outline", labelKey: "merchant.nav.analytics", stack: "MerchantAnalytics" },
  { icon: "chatbubble-ellipses-outline", labelKey: "nav.messages", stack: "MerchantMessages" },
  { icon: "person-outline", labelKey: "nav.profile", stack: "MerchantProfile" },
];

export default function MerchantMenuScreen() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  const go = (item: NavItem) => {
    if (item.tab) {
      navigation.navigate("Main", { screen: item.tab });
      return;
    }
    if (item.stack === "MerchantOffers") navigation.navigate("MerchantOffers");
    else if (item.stack === "MerchantAnalytics") navigation.navigate("MerchantAnalytics");
    else if (item.stack === "MerchantMessages") navigation.navigate("MerchantMessages");
    else if (item.stack === "MerchantProfile") navigation.navigate("MerchantProfile");
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
    >
      <View style={styles.header}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>H</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t("merchant.hubTitle")}</Text>
          <Text style={styles.subtitle}>{user?.name ?? t("common.merchant")}</Text>
        </View>
      </View>

      <Pressable onPress={() => navigation.navigate("CreateListing")}>
        <LinearGradient colors={[colors.gold, colors.goldLight]} style={styles.createBtn}>
          <Ionicons name="add-circle" size={22} color={colors.purpleDark} />
          <Text style={styles.createBtnText}>{t("merchant.createListing")}</Text>
        </LinearGradient>
      </Pressable>

      <Text style={styles.sectionLabel}>{t("merchant.menuSection")}</Text>
      <View style={styles.menuCard}>
        {MAIN_NAV.map((item, idx) => (
          <Pressable
            key={item.labelKey}
            style={[styles.menuRow, idx < MAIN_NAV.length - 1 && styles.menuRowBorder]}
            onPress={() => go(item)}
          >
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon} size={20} color={colors.purpleDark} />
            </View>
            <Text style={styles.menuLabel}>{t(item.labelKey as Parameters<typeof t>[0])}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
          </Pressable>
        ))}
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="shield-checkmark" size={22} color={colors.purple} />
        <View style={styles.infoText}>
          <Text style={styles.infoTitle}>{t("merchant.trustTitle")}</Text>
          <Text style={styles.infoDesc}>{t("merchant.trustDesc")}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontSize: 22, fontWeight: "900", color: colors.purpleDark },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontWeight: "900", color: colors.purpleDark },
  subtitle: { fontSize: 13, color: colors.gray400, marginTop: 2 },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.xl,
    paddingVertical: 14,
    marginBottom: spacing.lg,
  },
  createBtnText: { fontSize: 16, fontWeight: "800", color: colors.purpleDark },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.gray600,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  menuCard: { backgroundColor: colors.white, borderRadius: radius.xl, overflow: "hidden", marginBottom: spacing.lg },
  menuRow: { flexDirection: "row", alignItems: "center", padding: spacing.md, gap: spacing.md },
  menuRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.gray100 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.purpleBg,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.purpleDark },
  infoCard: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: "flex-start",
  },
  infoText: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: "700", color: colors.purpleDark },
  infoDesc: { fontSize: 12, color: colors.gray400, marginTop: 4, lineHeight: 18 },
});
