import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, type RouteProp } from "@react-navigation/native";
import type { Socket } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { trpcCall } from "../lib/api";
import { getSocket } from "../lib/socket";
import { colors, radius, spacing } from "../theme";
import type { RootStackParamList } from "../navigation/types";

type ChatMessage = {
  id: number;
  conversationId: number;
  senderId: number;
  body: string | null;
  isRead: boolean;
  createdAt: string;
};

const TYPING_EMIT_INTERVAL_MS = 1000;
const TYPING_HIDE_AFTER_MS = 1800;

export default function ChatThreadScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "ChatThread">>();
  const { conversationId } = route.params;
  const { user } = useAuth();
  const userId = user?.id;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);

  const typingHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingEmit = useRef(0);

  const markRead = useCallback(() => {
    trpcCall("chat.markRead", { conversationId }, "mutation").catch(() => {});
  }, [conversationId]);

  // Initial load + mark existing messages read.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await trpcCall<ChatMessage[]>("chat.messages", { conversationId });
        if (active) setMessages(rows);
        markRead();
      } catch {
        /* offline */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [conversationId, markRead]);

  // Realtime: join room, receive messages, typing and read receipts.
  useEffect(() => {
    if (!userId) return;
    let active = true;
    let socket: Socket | null = null;

    const onMessage = (message: ChatMessage) => {
      if (message.conversationId !== conversationId) return;
      setMessages((cur) => (cur.some((m) => m.id === message.id) ? cur : [...cur, message]));
      if (message.senderId !== userId) {
        markRead();
        setOtherTyping(false);
      }
    };

    const onTyping = (event: { conversationId: number; userId: number }) => {
      if (event.conversationId !== conversationId || event.userId === userId) return;
      setOtherTyping(true);
      if (typingHideTimer.current) clearTimeout(typingHideTimer.current);
      typingHideTimer.current = setTimeout(() => setOtherTyping(false), TYPING_HIDE_AFTER_MS);
    };

    const onRead = (event: { conversationId: number; readerId: number }) => {
      if (event.conversationId !== conversationId || event.readerId === userId) return;
      setMessages((cur) =>
        cur.map((m) => (m.senderId === userId && !m.isRead ? { ...m, isRead: true } : m))
      );
    };

    (async () => {
      socket = await getSocket();
      if (!socket || !active) return;
      socket.emit("chat:join", conversationId);
      socket.on("chat:message", onMessage);
      socket.on("chat:typing", onTyping);
      socket.on("chat:read", onRead);
    })();

    return () => {
      active = false;
      socket?.off("chat:message", onMessage);
      socket?.off("chat:typing", onTyping);
      socket?.off("chat:read", onRead);
      if (typingHideTimer.current) clearTimeout(typingHideTimer.current);
    };
  }, [conversationId, userId, markRead]);

  const onChangeDraft = (text: string) => {
    setDraft(text);
    const now = Date.now();
    if (now - lastTypingEmit.current > TYPING_EMIT_INTERVAL_MS) {
      lastTypingEmit.current = now;
      getSocket().then((s) => s?.emit("chat:typing", conversationId)).catch(() => {});
    }
  };

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const result = await trpcCall<{ message: ChatMessage }>(
        "chat.send",
        { conversationId, body },
        "mutation"
      );
      setDraft("");
      setMessages((cur) =>
        cur.some((m) => m.id === result.message.id) ? cur : [...cur, result.message]
      );
    } catch {
      /* keep draft so the user can retry */
    } finally {
      setSending(false);
    }
  };

  // Inverted FlatList wants newest first.
  const inverted = useMemo(() => [...messages].reverse(), [messages]);
  const lastMineId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].senderId === userId) return messages[i].id;
    }
    return null;
  }, [messages, userId]);

  if (loading) {
    return <ActivityIndicator color={colors.purple} style={{ flex: 1, marginTop: 100 }} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={inverted}
        inverted
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.messages}
        ListHeaderComponent={
          otherTyping ? (
            <View style={[styles.bubble, styles.theirBubble, styles.typingBubble]}>
              <Text style={styles.typingText}>Typing...</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const mine = item.senderId === userId;
          return (
            <View style={[styles.bubble, mine ? styles.myBubble : styles.theirBubble]}>
              <Text style={[styles.bubbleText, mine && styles.myBubbleText]}>{item.body}</Text>
              <View style={styles.metaRow}>
                <Text style={[styles.metaText, mine && styles.myMetaText]}>
                  {new Date(item.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                {mine && item.id === lastMineId && (
                  <View style={styles.receipt}>
                    <Ionicons
                      name={item.isRead ? "checkmark-done" : "checkmark"}
                      size={13}
                      color={item.isRead ? colors.goldLight : "rgba(255,255,255,0.6)"}
                    />
                    <Text style={[styles.metaText, styles.myMetaText]}>
                      {item.isRead ? "Read" : "Sent"}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubble-ellipses-outline" size={40} color={colors.gray400} />
            <Text style={styles.emptyText}>Say hello to start the conversation</Text>
          </View>
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={colors.gray400}
          value={draft}
          onChangeText={onChangeDraft}
          multiline
          maxLength={1000}
        />
        <Pressable onPress={send} disabled={sending || !draft.trim()}>
          <LinearGradient
            colors={[colors.purple, colors.purpleLight]}
            style={[styles.sendBtn, (sending || !draft.trim()) && { opacity: 0.5 }]}
          >
            <Ionicons name="send" size={20} color={colors.white} />
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.purpleBg },
  messages: { padding: spacing.md, gap: 2 },
  bubble: { maxWidth: "82%", borderRadius: radius.xl, paddingHorizontal: spacing.md, paddingVertical: 10, marginBottom: spacing.sm },
  myBubble: { alignSelf: "flex-end", backgroundColor: colors.purple, borderBottomRightRadius: radius.sm },
  theirBubble: { alignSelf: "flex-start", backgroundColor: colors.white, borderBottomLeftRadius: radius.sm },
  bubbleText: { fontSize: 15, lineHeight: 21, color: colors.gray800 },
  myBubbleText: { color: colors.white },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6, marginTop: 4 },
  metaText: { fontSize: 10, color: colors.gray400 },
  myMetaText: { color: "rgba(255,255,255,0.7)" },
  receipt: { flexDirection: "row", alignItems: "center", gap: 2 },
  typingBubble: { paddingVertical: 8 },
  typingText: { fontSize: 13, color: colors.gray400, fontStyle: "italic" },
  empty: { alignItems: "center", padding: spacing.xl, transform: [{ scaleY: -1 }] },
  emptyText: { color: colors.gray400, marginTop: spacing.sm, fontSize: 13 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", padding: spacing.md, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: "#EDE9FE", gap: spacing.sm },
  input: { flex: 1, backgroundColor: colors.purpleBg, borderRadius: radius.xl, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, maxHeight: 100, color: colors.gray800 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
