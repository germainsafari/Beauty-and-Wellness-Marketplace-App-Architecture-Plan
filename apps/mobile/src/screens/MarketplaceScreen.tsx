import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { useT } from "@hafi/i18n";
import { trpcCall } from "../lib/api";
import { colors, radius, spacing } from "../theme";
import type { RootStackParamList } from "../navigation/types";

type Listing = {
  id: number;
  title: string;
  price: string;
  originalPrice?: string | null;
  condition: string;
  images: string[];
  location: string | null;
  isBumped: boolean;
  likes: number;
  brand?: string | null;
};

type SortKey = "default" | "trending" | "new" | "price_asc" | "price_desc";
type BrowseMode = "all" | "saved" | "near";

const CATEGORIES = [
  { key: "skincare", icon: "water-outline" as const, search: "skincare serum cream" },
  { key: "hair", icon: "cut-outline" as const, search: "hair shampoo conditioner" },
  { key: "makeup", icon: "color-palette-outline" as const, search: "makeup lipstick foundation" },
  { key: "tools", icon: "construct-outline" as const, search: "tools dryer clipper" },
  { key: "wellness", icon: "leaf-outline" as const, search: "wellness spa massage" },
  { key: "fragrance", icon: "flower-outline" as const, search: "perfume fragrance" },
  { key: "nails", icon: "hand-left-outline" as const, search: "nail polish gel" },
  { key: "supplements", icon: "nutrition-outline" as const, search: "vitamin supplement" },
];

const CONDITIONS = ["", "new", "like_new", "good", "fair"] as const;

export default function MarketplaceScreen() {
  const t = useT();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState<string | undefined>();
  const [sort, setSort] = useState<SortKey>("default");
  const [condition, setCondition] = useState("");
  const [browseMode, setBrowseMode] = useState<BrowseMode>("all");
  const [showMenu, setShowMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const items = await trpcCall<Listing[]>("listings.list", {
        search: categorySearch || search || undefined,
        condition: condition || undefined,
        limit: 48,
      });
      let sorted = [...items];
      if (sort === "trending") sorted.sort((a, b) => b.likes - a.likes);
      if (sort === "new") sorted.sort((a, b) => b.id - a.id);
      if (sort === "price_asc") sorted.sort((a, b) => Number(a.price) - Number(b.price));
      if (sort === "price_desc") sorted.sort((a, b) => Number(b.price) - Number(a.price));
      if (browseMode === "saved" && user) {
        sorted = sorted.filter((l) => favoriteIds.has(l.id));
      }
      setListings(sorted);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, categorySearch, sort, condition, browseMode, favoriteIds, user]);

  useEffect(() => {
    if (user) {
      trpcCall<number[]>("listings.myFavoriteIds").then((ids) => setFavoriteIds(new Set(ids))).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const toggleFavorite = async (listingId: number) => {
    if (!user) return;
    await trpcCall("listings.toggleFavorite", { listingId }, "mutation");
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) next.delete(listingId);
      else next.add(listingId);
      return next;
    });
  };

  const formatPrice = (p: string) => `RWF ${Number(p).toLocaleString()}`;

  const sortLabel = (key: SortKey) => {
    const map: Record<SortKey, string> = {
      default: t("marketplace.sortRecommended"),
      trending: t("marketplace.sortTrending"),
      new: t("marketplace.sortNew"),
      price_asc: t("marketplace.sortPriceAsc"),
      price_desc: t("marketplace.sortPriceDesc"),
    };
    return map[key];
  };

  const renderCard = ({ item }: { item: Listing }) => {
    const discount =
      item.originalPrice && Number(item.originalPrice) > Number(item.price)
        ? Math.round((1 - Number(item.price) / Number(item.originalPrice)) * 100)
        : null;

    return (
      <Pressable style={styles.card} onPress={() => navigation.navigate("ItemDetail", { id: item.id })}>
        <View style={styles.cardImageWrap}>
          {item.images?.[0] ? (
            <Image source={{ uri: item.images[0] }} style={styles.cardImage} contentFit="cover" />
          ) : (
            <Text style={{ fontSize: 32 }}>✨</Text>
          )}
          {item.condition === "new" && (
            <View style={styles.newBadge}><Text style={styles.badgeText}>NEW</Text></View>
          )}
          {item.isBumped && (
            <View style={styles.hotBadge}><Text style={styles.badgeText}>🔥</Text></View>
          )}
          {discount ? (
            <View style={styles.discountBadge}><Text style={styles.badgeText}>-{discount}%</Text></View>
          ) : null}
          {user && (
            <Pressable
              style={[styles.heartBtn, favoriteIds.has(item.id) && styles.heartBtnActive]}
              onPress={(e) => { e.stopPropagation?.(); toggleFavorite(item.id); }}
            >
              <Ionicons
                name={favoriteIds.has(item.id) ? "heart" : "heart-outline"}
                size={18}
                color={favoriteIds.has(item.id) ? colors.rose : colors.gray400}
              />
            </Pressable>
          )}
        </View>
        {item.brand ? <Text style={styles.brand} numberOfLines={1}>{item.brand}</Text> : null}
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
        <Text style={styles.cardLoc} numberOfLines={1}>📍 {item.location || "Rwanda"}</Text>
      </Pressable>
    );
  };

  const ListHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Pressable style={styles.menuBtn} onPress={() => setShowMenu(true)}>
          <Ionicons name="menu" size={22} color={colors.purpleDark} />
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{t("marketplace.title")}</Text>
          <Text style={styles.subtitle}>{t("marketplace.subtitle")}</Text>
        </View>
      </View>

      <Pressable onPress={() => navigation.navigate("CreateListing")}>
        <LinearGradient colors={[colors.purple, colors.purpleLight]} style={styles.sellBtn}>
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={styles.sellBtnText}>{t("marketplace.sellItem")}</Text>
        </LinearGradient>
      </Pressable>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickNav}>
        {([
          { mode: "all" as BrowseMode, icon: "storefront-outline" as const, label: t("marketplace.browseAll") },
          { mode: "saved" as BrowseMode, icon: "heart-outline" as const, label: t("marketplace.savedItems") },
          { mode: "near" as BrowseMode, icon: "location-outline" as const, label: t("common.nearMe") },
        ]).map((item) => (
          <Pressable
            key={item.mode}
            style={[styles.quickNavItem, browseMode === item.mode && styles.quickNavActive]}
            onPress={() => {
              setBrowseMode(item.mode);
              if (item.mode === "near") setSort("trending");
            }}
          >
            <View style={[styles.quickIconCircle, browseMode === item.mode && styles.quickIconActive]}>
              <Ionicons name={item.icon} size={18} color={browseMode === item.mode ? colors.white : colors.purpleDark} />
            </View>
            <Text style={[styles.quickNavLabel, browseMode === item.mode && styles.quickNavLabelActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.gray400} />
        <TextInput
          style={styles.searchInput}
          placeholder={t("marketplace.searchPlaceholder")}
          placeholderTextColor={colors.gray400}
          value={search}
          onChangeText={(v) => { setSearch(v); setCategorySearch(undefined); }}
        />
        <Pressable onPress={() => setShowFilters(true)}>
          <Ionicons name="options-outline" size={22} color={colors.purple} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.key}
            style={styles.categoryItem}
            onPress={() => {
              setCategorySearch(cat.search);
              setSearch("");
              setBrowseMode("all");
            }}
          >
            <View style={styles.categoryCircle}>
              <Ionicons name={cat.icon} size={20} color={colors.purpleDark} />
            </View>
            <Text style={styles.categoryLabel}>{t(`marketplace.cat.${cat.key}` as Parameters<typeof t>[0])}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          <Ionicons name="cube-outline" size={14} color={colors.gray400} /> {listings.length} {t("marketplace.items")}
        </Text>
        {favoriteIds.size > 0 && (
          <Pressable onPress={() => navigation.navigate("SavedListings")}>
            <Text style={styles.savedText}>{favoriteIds.size} {t("marketplace.saved")} ♥</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <>
          <ListHeader />
          <ActivityIndicator color={colors.purple} style={{ marginTop: 40 }} />
        </>
      ) : (
        <FlatList
          data={listings}
          numColumns={2}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          ListHeaderComponent={ListHeader}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.purple} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>🛍️</Text>
              <Text style={styles.emptyTitle}>{t("marketplace.noItems")}</Text>
            </View>
          }
          renderItem={renderCard}
        />
      )}

      {/* Facebook-style sidebar menu */}
      <Modal visible={showMenu} animationType="slide" transparent>
        <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)}>
          <Pressable style={styles.menuPanel} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.menuTitle}>{t("marketplace.title")}</Text>
            {([
              { icon: "storefront-outline" as const, label: t("marketplace.browseAll"), action: () => { setBrowseMode("all"); setShowMenu(false); } },
              { icon: "heart-outline" as const, label: t("marketplace.savedItems"), action: () => { setShowMenu(false); navigation.navigate("SavedListings"); } },
              { icon: "pricetag-outline" as const, label: t("marketplace.sellItem"), action: () => { setShowMenu(false); navigation.navigate("CreateListing"); } },
              { icon: "bag-outline" as const, label: t("marketplace.myPurchases"), action: () => { setShowMenu(false); navigation.navigate("Main", { screen: "Profile" }); } },
              { icon: "chatbubble-ellipses-outline" as const, label: t("nav.messages"), action: () => { setShowMenu(false); navigation.navigate("Main", { screen: "Messages" }); } },
            ]).map((item, idx, arr) => (
              <Pressable key={item.label} style={[styles.menuItem, idx < arr.length - 1 && styles.menuItemBorder]} onPress={item.action}>
                <View style={styles.menuIconCircle}>
                  <Ionicons name={item.icon} size={20} color={colors.purpleDark} />
                </View>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </Pressable>
            ))}
            <View style={styles.menuDivider} />
            <Text style={styles.menuSection}>{t("marketplace.categories")}</Text>
            {CATEGORIES.slice(0, 6).map((cat) => (
              <Pressable
                key={cat.key}
                style={styles.menuItem}
                onPress={() => {
                  setCategorySearch(cat.search);
                  setSearch("");
                  setShowMenu(false);
                }}
              >
                <View style={styles.menuIconCircle}>
                  <Ionicons name={cat.icon} size={20} color={colors.purpleDark} />
                </View>
                <Text style={styles.menuItemLabel}>{t(`marketplace.cat.${cat.key}` as Parameters<typeof t>[0])}</Text>
              </Pressable>
            ))}
            <View style={styles.menuFooter}>
              <Ionicons name="shield-checkmark" size={16} color={colors.purple} />
              <Text style={styles.menuFooterText}>{t("marketplace.buyerProtection")}</Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Sort & condition filters */}
      <Modal visible={showFilters} animationType="fade" transparent>
        <Pressable style={styles.filterOverlay} onPress={() => setShowFilters(false)}>
          <View style={styles.filterSheet}>
            <Text style={styles.filterTitle}>{t("marketplace.filters")}</Text>
            <Text style={styles.filterLabel}>{t("marketplace.sortBy")}</Text>
            {(["default", "trending", "new", "price_asc", "price_desc"] as SortKey[]).map((key) => (
              <Pressable key={key} style={styles.filterOption} onPress={() => setSort(key)}>
                <Text style={[styles.filterOptionText, sort === key && styles.filterOptionActive]}>{sortLabel(key)}</Text>
                {sort === key && <Ionicons name="checkmark" size={18} color={colors.purple} />}
              </Pressable>
            ))}
            <Text style={[styles.filterLabel, { marginTop: spacing.md }]}>{t("marketplace.condition")}</Text>
            {CONDITIONS.map((c) => (
              <Pressable key={c || "all"} style={styles.filterOption} onPress={() => setCondition(c)}>
                <Text style={[styles.filterOptionText, condition === c && styles.filterOptionActive]}>
                  {c ? c.replace("_", " ") : t("marketplace.allConditions")}
                </Text>
                {condition === c && <Ionicons name="checkmark" size={18} color={colors.purple} />}
              </Pressable>
            ))}
            <Pressable style={styles.applyBtn} onPress={() => setShowFilters(false)}>
              <Text style={styles.applyBtnText}>{t("marketplace.applyFilters")}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.purpleBg },
  header: { backgroundColor: colors.white, padding: spacing.md, paddingTop: spacing.lg, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl, marginBottom: spacing.sm },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginBottom: spacing.md },
  menuBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.purpleBg, alignItems: "center", justifyContent: "center" },
  titleBlock: { flex: 1 },
  title: { fontSize: 26, fontWeight: "900", color: colors.purpleDark },
  subtitle: { color: colors.gray400, fontSize: 12, marginTop: 2 },
  sellBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: radius.xl, paddingVertical: 12, marginBottom: spacing.md },
  sellBtnText: { color: colors.white, fontWeight: "800", fontSize: 15 },
  quickNav: { marginBottom: spacing.sm },
  quickNavItem: { alignItems: "center", marginRight: spacing.md, width: 72 },
  quickNavActive: {},
  quickIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.purpleBg, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  quickIconActive: { backgroundColor: colors.purple },
  quickNavLabel: { fontSize: 10, fontWeight: "600", color: colors.gray600, textAlign: "center" },
  quickNavLabelActive: { color: colors.purple, fontWeight: "700" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.purpleBg,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.gray800 },
  categories: { marginBottom: spacing.sm },
  categoryItem: { alignItems: "center", marginRight: spacing.md, width: 68 },
  categoryCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.gray100, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  categoryLabel: { fontSize: 10, fontWeight: "600", color: colors.gray600, textAlign: "center" },
  statsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statsText: { fontSize: 12, color: colors.gray400 },
  savedText: { fontSize: 12, fontWeight: "700", color: colors.purple },
  grid: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  gridRow: { gap: spacing.sm, marginBottom: spacing.sm },
  card: { flex: 1, backgroundColor: colors.white, borderRadius: radius.xl, overflow: "hidden", paddingBottom: spacing.sm },
  cardImageWrap: { aspectRatio: 0.85, backgroundColor: "#F3E8FF", alignItems: "center", justifyContent: "center" },
  cardImage: { width: "100%", height: "100%" },
  newBadge: { position: "absolute", top: 8, left: 8, backgroundColor: colors.emerald, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  hotBadge: { position: "absolute", top: 8, right: 8, backgroundColor: colors.gold, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full },
  discountBadge: { position: "absolute", top: 8, right: 8, backgroundColor: colors.rose, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: "800" },
  heartBtn: { position: "absolute", bottom: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  heartBtnActive: { backgroundColor: "#FEE2E2" },
  brand: { fontSize: 9, fontWeight: "700", color: colors.gray400, textTransform: "uppercase", paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
  cardTitle: { fontSize: 12, fontWeight: "600", color: colors.purpleDark, paddingHorizontal: spacing.sm, paddingTop: 4 },
  cardPrice: { fontSize: 15, fontWeight: "900", color: colors.purple, paddingHorizontal: spacing.sm },
  cardLoc: { fontSize: 10, color: colors.gray400, paddingHorizontal: spacing.sm },
  empty: { alignItems: "center", padding: spacing.xl * 2 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.gray600, marginTop: spacing.md },
  menuOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", flexDirection: "row" },
  menuPanel: { width: "82%", maxWidth: 320, backgroundColor: colors.white, paddingTop: spacing.xl, paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  menuTitle: { fontSize: 24, fontWeight: "900", color: colors.purpleDark, marginBottom: spacing.lg, paddingHorizontal: spacing.sm },
  menuItem: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 12, paddingHorizontal: spacing.sm },
  menuItemBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.gray100 },
  menuIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gray100, alignItems: "center", justifyContent: "center" },
  menuItemLabel: { fontSize: 15, fontWeight: "600", color: colors.purpleDark },
  menuDivider: { height: 1, backgroundColor: colors.gray100, marginVertical: spacing.md },
  menuSection: { fontSize: 13, fontWeight: "700", color: colors.gray600, paddingHorizontal: spacing.sm, marginBottom: spacing.sm },
  menuFooter: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.lg, padding: spacing.sm, backgroundColor: colors.purpleBg, borderRadius: radius.lg },
  menuFooterText: { fontSize: 12, fontWeight: "600", color: colors.purple, flex: 1 },
  filterOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  filterSheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  filterTitle: { fontSize: 18, fontWeight: "900", color: colors.purpleDark, marginBottom: spacing.md },
  filterLabel: { fontSize: 13, fontWeight: "700", color: colors.gray600, marginBottom: spacing.sm },
  filterOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  filterOptionText: { fontSize: 15, color: colors.gray800 },
  filterOptionActive: { color: colors.purple, fontWeight: "700" },
  applyBtn: { backgroundColor: colors.purple, borderRadius: radius.xl, paddingVertical: 14, alignItems: "center", marginTop: spacing.lg },
  applyBtnText: { color: colors.white, fontWeight: "800", fontSize: 16 },
});
