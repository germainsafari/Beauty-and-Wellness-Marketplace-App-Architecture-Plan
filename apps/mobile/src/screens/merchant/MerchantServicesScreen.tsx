import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useT } from "@hafi/i18n";
import { trpcCall } from "../../lib/api";
import { colors, radius, spacing } from "../../theme";

type Category = { id: number; name: string; icon: string | null };

type Service = {
  id: number;
  name: string;
  description: string | null;
  duration: number;
  price: string;
  categoryId: number | null;
  categoryName: string | null;
  categoryIcon: string | null;
  isActive: boolean;
};

type ServiceForm = {
  name: string;
  description: string;
  duration: string;
  price: string;
  categoryId: string;
};

const emptyForm: ServiceForm = {
  name: "",
  description: "",
  duration: "60",
  price: "",
  categoryId: "",
};

export default function MerchantServicesScreen() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadServices = useCallback(() => {
    trpcCall<Service[]>("merchant.services")
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadServices();
    trpcCall<Category[]>("discovery.categories").then(setCategories).catch(() => {});
  }, [loadServices]);

  const formatPrice = (p: string) => `RWF ${Number(p).toLocaleString()}`;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEdit = (service: Service) => {
    setEditing(service);
    setForm({
      name: service.name,
      description: service.description ?? "",
      duration: String(service.duration),
      price: String(Number(service.price)),
      categoryId: service.categoryId ? String(service.categoryId) : "",
    });
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    setError("");
  };

  const save = async () => {
    const duration = parseInt(form.duration, 10);
    const price = parseFloat(form.price);
    if (!form.name.trim()) {
      setError("Service name is required");
      return;
    }
    if (isNaN(duration) || duration < 5) {
      setError("Duration must be at least 5 minutes");
      return;
    }
    if (isNaN(price) || price <= 0) {
      setError("Price must be greater than zero");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        duration,
        price,
        categoryId: form.categoryId ? parseInt(form.categoryId, 10) : undefined,
      };

      if (editing) {
        await trpcCall("merchant.updateService", { id: editing.id, ...payload }, "mutation");
      } else {
        await trpcCall("merchant.createService", payload, "mutation");
      }
      closeForm();
      loadServices();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save service");
    } finally {
      setSaving(false);
    }
  };

  const remove = (service: Service) => {
    Alert.alert(
      "Remove service",
      `Remove "${service.name}"? Clients will no longer see this service.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await trpcCall("merchant.deleteService", { id: service.id }, "mutation");
              loadServices();
            } catch {
              Alert.alert("Error", "Could not remove service");
            }
          },
        },
      ]
    );
  };

  const activeServices = services.filter((s) => s.isActive);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t("merchant.nav.services")}</Text>
            <Text style={styles.subtitle}>{t("merchant.servicesSubtitle")}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Ionicons name="add" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
        ) : activeServices.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="briefcase-outline" size={48} color={colors.gray400} />
            <Text style={styles.emptyTitle}>{t("merchant.servicesEmpty")}</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openCreate}>
              <Text style={styles.emptyBtnText}>{t("merchant.addFirstService")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          activeServices.map((service) => (
            <View key={service.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardHeader}>
                  {service.categoryIcon ? <Text style={styles.categoryIcon}>{service.categoryIcon}</Text> : null}
                  {service.categoryName ? (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{service.categoryName}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => openEdit(service)} style={styles.actionBtn}>
                    <Ionicons name="pencil-outline" size={18} color={colors.gray400} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => remove(service)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.serviceName}>{service.name}</Text>
              {service.description ? (
                <Text style={styles.serviceDesc} numberOfLines={2}>{service.description}</Text>
              ) : null}
              <Text style={styles.duration}>{service.duration} min</Text>
              <Text style={styles.price}>{formatPrice(service.price)}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showForm} transparent animationType="slide" onRequestClose={closeForm}>
        <Pressable style={styles.modalOverlay} onPress={closeForm}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editing ? t("merchant.editService") : t("merchant.newService")}
              </Text>
              <TouchableOpacity onPress={closeForm}>
                <Ionicons name="close" size={24} color={colors.gray400} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>{t("merchant.serviceName")} *</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(name) => setForm({ ...form, name })}
                placeholder="e.g. Haircut & styling"
              />

              <Text style={styles.label}>{t("merchant.serviceDescription")}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.description}
                onChangeText={(description) => setForm({ ...form, description })}
                placeholder="What's included?"
                multiline
              />

              {categories.length > 0 && (
                <>
                  <Text style={styles.label}>{t("merchant.serviceCategory")}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
                    <TouchableOpacity
                      style={[styles.categoryChip, !form.categoryId && styles.categoryChipActive]}
                      onPress={() => setForm({ ...form, categoryId: "" })}
                    >
                      <Text style={[styles.categoryChipText, !form.categoryId && styles.categoryChipTextActive]}>
                        None
                      </Text>
                    </TouchableOpacity>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.categoryChip, form.categoryId === String(cat.id) && styles.categoryChipActive]}
                        onPress={() => setForm({ ...form, categoryId: String(cat.id) })}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            form.categoryId === String(cat.id) && styles.categoryChipTextActive,
                          ]}
                        >
                          {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>{t("merchant.serviceDuration")} *</Text>
                  <TextInput
                    style={styles.input}
                    value={form.duration}
                    onChangeText={(duration) => setForm({ ...form, duration })}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.label}>{t("merchant.servicePrice")} *</Text>
                  <TextInput
                    style={styles.input}
                    value={form.price}
                    onChangeText={(price) => setForm({ ...form, price })}
                    keyboardType="number-pad"
                    placeholder="15000"
                  />
                </View>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
                <Text style={styles.saveBtnText}>
                  {saving ? "..." : editing ? t("merchant.saveService") : t("merchant.addService")}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.lg },
  title: { fontSize: 26, fontWeight: "900", color: colors.purpleDark },
  subtitle: { fontSize: 14, color: colors.gray400, marginTop: 2 },
  addBtn: {
    backgroundColor: colors.purple,
    width: 44,
    height: 44,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { alignItems: "center", padding: spacing.xl * 2, backgroundColor: colors.white, borderRadius: radius.xl },
  emptyTitle: { fontSize: 14, color: colors.gray400, marginTop: spacing.md, textAlign: "center" },
  emptyBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.purple,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
  },
  emptyBtnText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.sm },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm, flex: 1 },
  cardActions: { flexDirection: "row", gap: 4 },
  actionBtn: { padding: 6 },
  categoryIcon: { fontSize: 20 },
  categoryBadge: { backgroundColor: colors.purpleBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  categoryText: { fontSize: 11, fontWeight: "700", color: colors.purple },
  serviceName: { fontSize: 17, fontWeight: "800", color: colors.purpleDark },
  serviceDesc: { fontSize: 13, color: colors.gray400, marginTop: 4 },
  duration: { fontSize: 13, color: colors.gray400, marginTop: spacing.sm },
  price: { fontSize: 20, fontWeight: "900", color: colors.purple, marginTop: spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl * 1.5,
    borderTopRightRadius: radius.xl * 1.5,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: { fontSize: 18, fontWeight: "900", color: colors.purpleDark },
  modalBody: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  label: { fontSize: 13, fontWeight: "700", color: colors.purpleDark, marginBottom: 6, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.purpleDark,
  },
  textArea: { height: 80, textAlignVertical: "top" },
  categoryRow: { marginBottom: spacing.sm },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: colors.purple },
  categoryChipText: { fontSize: 13, fontWeight: "600", color: colors.gray400 },
  categoryChipTextActive: { color: colors.white },
  row: { flexDirection: "row", gap: spacing.sm },
  halfField: { flex: 1 },
  errorText: { color: "#EF4444", fontSize: 13, marginTop: spacing.sm },
  saveBtn: {
    backgroundColor: colors.purple,
    borderRadius: radius.xl,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  saveBtnText: { color: colors.white, fontWeight: "800", fontSize: 16 },
});
