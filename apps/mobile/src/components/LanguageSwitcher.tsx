import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LOCALES, type Locale } from "@hafi/i18n";
import { useLocale } from "@hafi/i18n";
import { colors, radius, spacing } from "../theme";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t("lang.choose")}</Text>
      <View style={styles.row}>
        {LOCALES.map(({ code, labelKey }) => (
          <Pressable
            key={code}
            style={[styles.chip, locale === code && styles.chipActive]}
            onPress={() => setLocale(code as Locale)}
          >
            <Text style={[styles.chipText, locale === code && styles.chipTextActive]}>
              {code.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { fontSize: 12, color: colors.gray400, fontWeight: "600", marginBottom: spacing.xs },
  row: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.lg,
    backgroundColor: colors.purpleBg,
    borderWidth: 1,
    borderColor: "#EDE9FE",
  },
  chipActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  chipText: { fontSize: 11, fontWeight: "800", color: colors.gray600 },
  chipTextActive: { color: colors.white },
});
