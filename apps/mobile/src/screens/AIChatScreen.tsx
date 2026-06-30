import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { useAuth } from "../context/AuthContext";
import { trpcCall } from "../lib/api";
import { colors, radius, spacing } from "../theme";

type AiMessage = { id: number; role: string; content: string; createdAt: string };

const QUICK_PROMPTS = [
  "Best skincare routine for oily skin?",
  "Find me braiding salons near Kigali",
  "What pre-loved makeup deals are trending?",
  "Help me negotiate a marketplace offer",
];

export default function AIChatScreen() {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const initSession = useCallback(async () => {
    try {
      const sessions = await trpcCall<{ id: number }[]>("ai.sessions");
      if (sessions.length > 0) {
        setSessionId(sessions[0].id);
        const msgs = await trpcCall<AiMessage[]>("ai.messages", { sessionId: sessions[0].id });
        setMessages(msgs);
      } else {
        const session = await trpcCall<{ id: number }>("ai.createSession", {}, "mutation");
        setSessionId(session.id);
        const msgs = await trpcCall<AiMessage[]>("ai.messages", { sessionId: session.id });
        setMessages(msgs);
      }
    } catch {
      /* offline */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { initSession(); }, [initSession]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || !sessionId || sending) return;
    setInput("");
    setSending(true);

    const optimistic: AiMessage = {
      id: Date.now(),
      role: "user",
      content: msg,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const result = await trpcCall<{ reply: string }>(
        "ai.chat",
        { sessionId, message: msg },
        "mutation"
      );
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: result.reply, createdAt: new Date().toISOString() },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: e instanceof Error ? e.message : "AI unavailable. Check your API key.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  if (loading) {
    return <ActivityIndicator color={colors.purple} style={{ flex: 1, marginTop: 100 }} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <LinearGradient colors={[colors.purpleDark, colors.purpleMid]} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={24} color={colors.white} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Hafi AI</Text>
            <Text style={styles.headerSub}>Your beauty concierge 💜</Text>
          </View>
        </View>
        <Text style={styles.headerGreeting}>Hey {user?.name?.split(" ")[0]}! How can I help you glow today?</Text>
      </LinearGradient>

      {messages.length <= 1 && (
        <View style={styles.prompts}>
          {QUICK_PROMPTS.map((p) => (
            <Pressable key={p} style={styles.promptChip} onPress={() => send(p)}>
              <Text style={styles.promptText}>{p}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.aiBubble]}>
            {item.role === "assistant" && (
              <Ionicons name="sparkles" size={14} color={colors.purple} style={{ marginBottom: 4 }} />
            )}
            <Text style={[styles.bubbleText, item.role === "user" && styles.userBubbleText]}>
              {item.content}
            </Text>
          </View>
        )}
      />

      {sending && <ActivityIndicator color={colors.purple} style={{ marginBottom: 8 }} />}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask about beauty, bookings, marketplace..."
          placeholderTextColor={colors.gray400}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
        />
        <Pressable style={styles.sendBtn} onPress={() => send()} disabled={sending}>
          <LinearGradient colors={[colors.purple, colors.purpleLight]} style={styles.sendGradient}>
            <Ionicons name="send" size={20} color={colors.white} />
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.purpleBg },
  header: { padding: spacing.md, paddingTop: spacing.lg },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  aiAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "900", color: colors.white },
  headerSub: { color: "#C4B5FD", fontSize: 13 },
  headerGreeting: { color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 20 },
  prompts: { flexDirection: "row", flexWrap: "wrap", padding: spacing.md, gap: spacing.sm },
  promptChip: { backgroundColor: colors.white, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#EDE9FE" },
  promptText: { fontSize: 12, color: colors.purple, fontWeight: "600" },
  messages: { padding: spacing.md, paddingBottom: spacing.sm },
  bubble: { maxWidth: "85%", borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.sm },
  userBubble: { alignSelf: "flex-end", backgroundColor: colors.purple },
  aiBubble: { alignSelf: "flex-start", backgroundColor: colors.white },
  bubbleText: { fontSize: 15, lineHeight: 22, color: colors.gray800 },
  userBubbleText: { color: colors.white },
  inputRow: { flexDirection: "row", alignItems: "flex-end", padding: spacing.md, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: "#EDE9FE", gap: spacing.sm },
  input: { flex: 1, backgroundColor: colors.purpleBg, borderRadius: radius.xl, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, maxHeight: 100, color: colors.gray800 },
  sendBtn: {},
  sendGradient: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
