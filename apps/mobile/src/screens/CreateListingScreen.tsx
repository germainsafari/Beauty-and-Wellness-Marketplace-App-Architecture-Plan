import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { trpcCall } from "../lib/api";
import { colors, radius, spacing } from "../theme";

const CONDITIONS = ["new", "like_new", "good", "fair"] as const;

export default function CreateListingScreen() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState<(typeof CONDITIONS)[number]>("good");
  const [loading, setLoading] = useState(false);

  const publish = async () => {
    if (title.length < 3 || !price) {
      Alert.alert("Missing info", "Add a title and price");
      return;
    }
    setLoading(true);
    try {
      await trpcCall("listings.create", {
        title,
        description,
        price: Number(price),
        condition,
        brand: brand || undefined,
        location: user?.location || "Kigali",
        isNegotiable: true,
        images: ["https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80"],
        tags: ["beauty"],
      }, "mutation");
      Alert.alert("Listed! 🎉", "Your item is now live on the marketplace.");
      setTitle("");
      setDescription("");
      setPrice("");
      setBrand("");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Sell on Hafi</Text>
      <Text style={styles.subtitle}>List your pre-loved beauty gems ✨</Text>

      <View style={styles.photoPlaceholder}>
        <Ionicons name="camera" size={32} color={colors.purple} />
        <Text style={styles.photoText}>Photo upload coming soon</Text>
        <Text style={styles.photoHint}>Demo uses a placeholder image</Text>
      </View>

      <Text style={styles.label}>Title *</Text>
      <TextInput style={styles.input} placeholder="e.g. MAC Ruby Woo Lipstick" value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Brand</Text>
      <TextInput style={styles.input} placeholder="Brand name" value={brand} onChangeText={setBrand} />

      <Text style={styles.label}>Price (RWF) *</Text>
      <TextInput style={styles.input} placeholder="15000" value={price} onChangeText={setPrice} keyboardType="numeric" />

      <Text style={styles.label}>Condition</Text>
      <View style={styles.conditionRow}>
        {CONDITIONS.map((c) => (
          <Pressable
            key={c}
            style={[styles.conditionChip, condition === c && styles.conditionActive]}
            onPress={() => setCondition(c)}
          >
            <Text style={[styles.conditionText, condition === c && styles.conditionTextActive]}>
              {c.replace("_", " ")}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Describe condition, usage, what's included..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <Pressable onPress={publish} disabled={loading}>
        <LinearGradient colors={[colors.purple, colors.purpleLight]} style={styles.cta}>
          <Text style={styles.ctaText}>{loading ? "Publishing..." : "Publish Listing"}</Text>
        </LinearGradient>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.purpleBg },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  title: { fontSize: 26, fontWeight: "900", color: colors.purpleDark, marginTop: spacing.md },
  subtitle: { color: colors.gray400, marginBottom: spacing.lg },
  photoPlaceholder: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#C4B5FD",
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  photoText: { color: colors.purple, fontWeight: "700", marginTop: spacing.sm },
  photoHint: { color: colors.gray400, fontSize: 12, marginTop: 4 },
  label: { fontWeight: "700", color: colors.purpleDark, marginBottom: spacing.sm, marginTop: spacing.sm },
  input: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, fontSize: 15, color: colors.gray800 },
  textarea: { minHeight: 100, textAlignVertical: "top" },
  conditionRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  conditionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.white },
  conditionActive: { backgroundColor: colors.purple },
  conditionText: { fontSize: 13, fontWeight: "600", color: colors.gray600, textTransform: "capitalize" },
  conditionTextActive: { color: colors.white },
  cta: { borderRadius: radius.xl, paddingVertical: 16, alignItems: "center", marginTop: spacing.xl },
  ctaText: { color: colors.white, fontWeight: "800", fontSize: 16 },
});
