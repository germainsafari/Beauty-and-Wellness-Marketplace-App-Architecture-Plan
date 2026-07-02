import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Socket } from "socket.io-client";
import { useT } from "@hafi/i18n";
import { trpcCall } from "../lib/api";
import { getSocket } from "../lib/socket";
import { colors, radius, spacing } from "../theme";
import type { RootStackParamList } from "../navigation/types";

export type Conversation = {
  id: number;
  otherUser: { id: number; name: string; avatarUrl: string | null } | null;
  lastMessage: { body: string | null; senderId: number; createdAt: string } | null;
  unreadCount: number;
  lastMessageAt: string | null;
};

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-RW", { month: "short", day: "numeric" });
}

export default function MessagesScreen() {
  const t = useT();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const conversationIds = useRef<number[]>([]);

  const load = useCallback(async () => {
    try {
      const rows = await trpcCall<Conversation[]>("chat.conversations");
      setConversations(rows);
      conversationIds.current = rows.map((c) => c.id);
      // Join every conversation room so new messages refresh the list live.
      const socket = await getSocket();
      rows.forEach((c) => socket?.emit("chat:join", c.id));
    } catch {
      /* offline */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload whenever the tab regains focus (e.g. returning from a thread).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    let active = true;
    let socket: Socket | null = null;
    const onMessage = (message: { conversationId: number }) => {
      if (conversationIds.current.includes(message.conversationId)) load();
    };
    const onRead = () => load();
    (async () => {
      socket = await getSocket();
      if (!socket || !active) return;
      socket.on("chat:message", onMessage);
      socket.on("chat:read", onRead);
    })();
    return () => {
      active = false;
      socket?.off("chat:message", onMessage);
      socket?.off("chat:read", onRead);
    };
  }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("nav.messages")}</Text>
        <Text style={styles.subtitle}>Chat with sellers and service providers</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.purple} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.purple}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.gray400} />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptyDesc}>Message a seller from any listing to start chatting</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                navigation.navigate("ChatThread", {
                  conversationId: item.id,
                  otherUserName: item.otherUser?.name,
                })
              }
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(item.otherUser?.name ?? "U")[0]}</Text>
              </View>
              <View style={styles.info}>
                <View style={styles.topRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.otherUser?.name ?? "User"}
                  </Text>
                  <Text style={styles.time}>
                    {relativeTime(item.lastMessage?.createdAt ?? item.lastMessageAt)}
                  </Text>
                </View>
                <View style={styles.bottomRow}>
                  <Text
                    style={[styles.preview, item.unreadCount > 0 && styles.previewUnread]}
                    numberOfLines={1}
                  >
                    {item.lastMessage?.body ?? "No messages yet"}
                  </Text>
                  {item.unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {item.unreadCount > 99 ? "99+" : item.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.purpleBg },
  header: { backgroundColor: colors.white, padding: spacing.md, paddingTop: spacing.lg, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  title: { fontSize: 26, fontWeight: "900", color: colors.purpleDark },
  subtitle: { color: colors.gray400, marginTop: 2 },
  list: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.purple, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.white, fontWeight: "900", fontSize: 20 },
  info: { flex: 1 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  name: { flex: 1, fontWeight: "800", fontSize: 15, color: colors.purpleDark },
  time: { fontSize: 11, color: colors.gray400 },
  bottomRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 4 },
  preview: { flex: 1, fontSize: 13, color: colors.gray400 },
  previewUnread: { color: colors.gray800, fontWeight: "700" },
  badge: { backgroundColor: colors.purple, borderRadius: radius.full, minWidth: 20, height: 20, paddingHorizontal: 6, alignItems: "center", justifyContent: "center" },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: "800" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.gray600, marginTop: spacing.md },
  emptyDesc: { fontSize: 13, color: colors.gray400, marginTop: spacing.sm, textAlign: "center" },
});
