import { generateAPIUrl } from "@/src/utils/urlGenerator";
import {
  ActionProvider,
  DataProvider,
  Renderer,
  ValidationProvider,
  VisibilityProvider,
  useActions,
} from "@json-render/react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { fetch as expoFetch } from "expo/fetch";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { dashboardRegistry, UnknownComponent } from "./registry";
import { INITIAL_DATA } from "./initialData";
import { componentList } from "./dashboardCatalog";
import { useDashboardTreeStream } from "./useDashboardTreeStream";

const SYSTEM_PROMPT = `You are a dashboard widget generator that outputs JSONL (JSON Lines) patches.

Output ONLY JSON patch lines. No markdown. No code fences. No explanations.

AVAILABLE COMPONENTS:
${componentList.join(", ")}

COMPONENT DETAILS:
- Card: { title?: string|null, description?: string|null, padding?: "sm"|"md"|"lg"|null } - Container with optional title
- Grid: { columns?: 1-4|null, gap?: "sm"|"md"|"lg"|null } - Grid layout
- Stack: { direction?: "horizontal"|"vertical"|null, gap?: "sm"|"md"|"lg"|null, align?: "start"|"center"|"end"|"stretch"|null } - Flex layout
- Metric: { label: string, valuePath: string, format?: "currency"|"percent"|"number"|null, trend?: "up"|"down"|"neutral"|null, trendValue?: string|null }
- Chart: { type: "bar"|"line"|"pie"|"area", dataPath: string, title?: string|null, height?: number|null } - Simplified chart
- Table: { title?: string|null, dataPath: string, columns: [{ key: string, label: string, format?: "text"|"currency"|"date"|"badge"|null }] } - Simplified table
- Select: { label?: string|null, bindPath: string, options: [{ value: string, label: string }], placeholder?: string|null } - Simplified select
- DatePicker: { label?: string|null, bindPath: string, placeholder?: string|null } - Simplified date input
- Button: { label: string, action: { name: string }, variant?: "primary"|"secondary"|"danger"|"ghost"|null, disabled?: boolean|null }
- Heading: { text: string, level?: "h1"|"h2"|"h3"|"h4"|null }
- Text: { content: string, variant?: "body"|"caption"|"label"|null, color?: "default"|"muted"|"success"|"warning"|"danger"|null }
- Badge: { text: string, variant?: "default"|"success"|"warning"|"danger"|"info"|null }
- Alert: { type: "info"|"success"|"warning"|"error", title: string, message?: string|null }
- Divider: { label?: string|null }
- Empty: { title: string, description?: string|null }

DATA BINDING:
- valuePath: "/analytics/revenue" (for Metric)
- dataPath: "/analytics/salesByRegion" (for Chart) or "/analytics/recentTransactions" (for Table)
- bindPath: "/form/region" or "/form/dateRange" (for Select/DatePicker)

OUTPUT FORMAT (JSONL patches):
- {"op":"set","path":"/root","value":"root-key"}
- {"op":"add","path":"/elements/root-key","value":{...}}

ELEMENT STRUCTURE:
{
  "key": "unique-key",
  "type": "ComponentType",
  "props": { ... },
  "children": ["child-key-1", "child-key-2"]
}

RULES:
1. First set /root to the root element's key
2. Add each element with a unique key using /elements/{key}
3. Parent elements list child keys in their "children" array
4. Stream elements progressively - parent first, then children
5. Each element must have: key, type, props
6. children contains STRING KEYS only
7. Do not output anything except JSON patch lines

Generate JSONL patches now.`;

const ACTION_HANDLERS = {
  refresh_data: () => Alert.alert("Action", "Refreshing data..."),
  apply_filter: () => Alert.alert("Action", "Applying filters..."),
  view_details: (params: Record<string, unknown>) =>
    Alert.alert("Details", JSON.stringify(params, null, 2)),
};

const QUICK_PROMPTS = [
  "Revenue dashboard with metrics and chart",
  "Recent transactions table with status badges",
  "Customer and orders overview with filters",
  "Sales by region chart and key metrics",
];

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function RNConfirmDialogManager() {
  const { pendingConfirmation, confirm, cancel } = useActions();
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const cfg = pendingConfirmation?.action.confirm;
    if (!cfg) {
      lastKeyRef.current = null;
      return;
    }

    const key = `${pendingConfirmation.action.name}:${cfg.title}:${cfg.message}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    Alert.alert(cfg.title, cfg.message, [
      {
        text: cfg.cancelLabel ?? "Cancel",
        style: "cancel",
        onPress: cancel,
      },
      {
        text: cfg.confirmLabel ?? "Confirm",
        style: cfg.variant === "danger" ? "destructive" : "default",
        onPress: confirm,
      },
    ]);
  }, [pendingConfirmation, confirm, cancel]);

  return null;
}

export default function Render() {
  const [prompt, setPrompt] = useState("");
  const [isOutputSheetOpen, setIsOutputSheetOpen] = useState(false);
  const [outputTab, setOutputTab] = useState<"patches" | "tree">("patches");
  const [showDoneBanner, setShowDoneBanner] = useState(false);

  const prevStatusRef = useRef<string | null>(null);
  const doneBannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { messages, setMessages, sendMessage, status, stop, error } = useChat({
    transport: new DefaultChatTransport({
      fetch: expoFetch as unknown as typeof globalThis.fetch,
      api: generateAPIUrl("/api/chat"),
    }),
    experimental_throttle: 50,
  });

  const { tree, parseError, reset } = useDashboardTreeStream(messages);

  const isStreaming = status === "submitted" || status === "streaming";

  const assistantOutput = useMemo(() => {
    return messages
      .filter((m) => m.role === "assistant")
      .flatMap((m) => m.parts)
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("");
  }, [messages]);

  const start = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    stop();
    reset();
    setShowDoneBanner(false);
    if (doneBannerTimeoutRef.current) {
      clearTimeout(doneBannerTimeoutRef.current);
      doneBannerTimeoutRef.current = null;
    }

    setMessages([
      {
        id: createId("system"),
        role: "system",
        parts: [{ type: "text", text: SYSTEM_PROMPT }],
      },
    ]);

    await sendMessage({
      text:
        trimmed +
        "\n\nAVAILABLE DATA:\n" +
        JSON.stringify(INITIAL_DATA, null, 2),
    });

    setPrompt("");
  }, [prompt, stop, reset, setMessages, sendMessage]);

  const clear = useCallback(() => {
    stop();
    reset();
    setMessages([]);
  }, [stop, reset, setMessages]);

  const hasElements = !!tree && Object.keys(tree.elements).length > 0;

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    if (!prev) return;

    const completedNow = (prev === "submitted" || prev === "streaming") && status === "ready";
    if (completedNow && hasElements && !parseError && !error) {
      setShowDoneBanner(true);
      if (doneBannerTimeoutRef.current) clearTimeout(doneBannerTimeoutRef.current);
      doneBannerTimeoutRef.current = setTimeout(() => {
        setShowDoneBanner(false);
      }, 2500);
    }
  }, [status, hasElements, parseError, error]);

  useEffect(() => {
    return () => {
      if (doneBannerTimeoutRef.current) {
        clearTimeout(doneBannerTimeoutRef.current);
        doneBannerTimeoutRef.current = null;
      }
    };
  }, []);

  const headerSubtitle = useMemo(() => {
    if (parseError) return `Parse error: ${parseError}`;
    if (error) return `AI error: ${error.message}`;
    if (!hasElements) return "Generate a dashboard from a prompt.";
    return "Rendered from JSON patches (streamed).";
  }, [parseError, error, hasElements]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b0f19" }}>
      <DataProvider initialData={INITIAL_DATA}>
        <VisibilityProvider>
          <ActionProvider handlers={ACTION_HANDLERS}>
            <ValidationProvider>
              <RNConfirmDialogManager />
              <View style={{ flex: 1, padding: 16 }}>
                <View>
                  <Text style={{ color: "#e5e7eb", fontSize: 24, fontWeight: 800 }}>
                    Render
                  </Text>
                  <Text style={{ color: "#9ca3af", marginTop: 6 }}>
                    {headerSubtitle}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", marginTop: 12 }}>
                  <TextInput
                    value={prompt}
                    onChangeText={setPrompt}
                    placeholder="Describe a revenue dashboard..."
                    placeholderTextColor="#9ca3af"
                    editable={!isStreaming}
                    style={{
                      flex: 1,
                      backgroundColor: "#0f172a",
                      borderColor: "#243041",
                      borderWidth: 1,
                      borderRadius: 12,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      color: "#e5e7eb",
                    }}
                    onSubmitEditing={(e) => {
                      e.preventDefault();
                      start();
                    }}
                  />
                  <Pressable
                    onPress={start}
                    disabled={isStreaming || !prompt.trim()}
                    style={{
                      marginLeft: 10,
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderRadius: 12,
                      backgroundColor: "#e5e7eb",
                      opacity: isStreaming || !prompt.trim() ? 0.6 : 1,
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#0b0f19", fontWeight: 800 }}>
                      {isStreaming ? "..." : "Generate"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={clear}
                    style={{
                      marginLeft: 10,
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#243041",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#e5e7eb", fontWeight: 800 }}>Clear</Text>
                  </Pressable>
                </View>

                <View style={{ flexDirection: "row", marginTop: 10, alignItems: "center" }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                    {QUICK_PROMPTS.map((p) => (
                      <Pressable
                        key={p}
                        disabled={isStreaming}
                        onPress={() => setPrompt(p)}
                        style={({ pressed }) => ({
                          marginRight: 8,
                          paddingVertical: 8,
                          paddingHorizontal: 10,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: "#243041",
                          backgroundColor: pressed ? "#0f172a" : "transparent",
                          opacity: isStreaming ? 0.5 : 1,
                        })}
                      >
                        <Text style={{ color: "#e5e7eb", fontWeight: 700, fontSize: 12 }}>
                          {p}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <Pressable
                    onPress={() => setIsOutputSheetOpen(true)}
                    style={{
                      marginLeft: 10,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#243041",
                    }}
                  >
                    <Text style={{ color: "#e5e7eb", fontWeight: 800, fontSize: 12 }}>
                      AI JSON
                    </Text>
                  </Pressable>
                </View>

                {showDoneBanner && (
                  <View style={styles.doneBanner}>
                    <Text style={styles.doneBannerText}>Generation complete</Text>
                    <Pressable onPress={() => setIsOutputSheetOpen(true)}>
                      <Text style={styles.doneBannerLink}>View output</Text>
                    </Pressable>
                  </View>
                )}

                <ScrollView
                  style={{ flex: 1, marginTop: 12 }}
                  contentContainerStyle={{ paddingBottom: 24 }}
                >
                  {!hasElements ? (
                    <View
                      style={{
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: "#243041",
                        padding: 16,
                        backgroundColor: "#111827",
                      }}
                    >
                      <Text style={{ color: "#9ca3af" }}>
                        Try: "Revenue dashboard with metrics and chart"
                      </Text>
                      <Text style={{ color: "#9ca3af", marginTop: 6 }}>
                        Or: "Recent transactions table"
                      </Text>
                    </View>
                  ) : (
                    <Renderer
                      tree={tree}
                      registry={dashboardRegistry}
                      loading={isStreaming}
                      fallback={UnknownComponent}
                    />
                  )}
                </ScrollView>
              </View>

              <Modal
                visible={isOutputSheetOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setIsOutputSheetOpen(false)}
              >
                <Pressable
                  style={styles.sheetBackdrop}
                  onPress={() => setIsOutputSheetOpen(false)}
                />
                <View style={styles.sheet}>
                  <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>AI Output</Text>
                    <Pressable onPress={() => setIsOutputSheetOpen(false)}>
                      <Text style={styles.sheetClose}>Close</Text>
                    </Pressable>
                  </View>

                  <View style={styles.sheetTabs}>
                    <Pressable
                      onPress={() => setOutputTab("patches")}
                      style={[
                        styles.sheetTab,
                        outputTab === "patches" && styles.sheetTabActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sheetTabText,
                          outputTab === "patches" && styles.sheetTabTextActive,
                        ]}
                      >
                        Patches
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setOutputTab("tree")}
                      style={[
                        styles.sheetTab,
                        outputTab === "tree" && styles.sheetTabActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sheetTabText,
                          outputTab === "tree" && styles.sheetTabTextActive,
                        ]}
                      >
                        Tree
                      </Text>
                    </Pressable>
                  </View>

                  <Text style={styles.sheetMeta}>
                    Status: {status}
                    {parseError ? ` · parseError: ${parseError}` : ""}
                    {hasElements ? ` · elements: ${Object.keys(tree?.elements ?? {}).length}` : ""}
                  </Text>

                  <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
                    <Text selectable style={styles.sheetBodyText}>
                      {outputTab === "patches"
                        ? assistantOutput || "(No output yet)"
                        : tree
                          ? JSON.stringify(tree, null, 2)
                          : "(No tree yet)"}
                    </Text>
                  </ScrollView>
                </View>
              </Modal>
            </ValidationProvider>
          </ActionProvider>
        </VisibilityProvider>
      </DataProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  doneBanner: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#14532d",
    backgroundColor: "#052e16",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  doneBannerText: {
    color: "#bbf7d0",
    fontWeight: 800,
  },
  doneBannerLink: {
    color: "#93c5fd",
    fontWeight: 800,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "78%",
    backgroundColor: "#0b0f19",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#243041",
    padding: 14,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetTitle: {
    color: "#e5e7eb",
    fontWeight: 900,
    fontSize: 16,
  },
  sheetClose: {
    color: "#9ca3af",
    fontWeight: 800,
  },
  sheetTabs: {
    flexDirection: "row",
    marginTop: 10,
  },
  sheetTab: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#243041",
    marginRight: 8,
  },
  sheetTabActive: {
    backgroundColor: "#111827",
    borderColor: "#60a5fa",
  },
  sheetTabText: {
    color: "#e5e7eb",
    fontWeight: 800,
    fontSize: 12,
  },
  sheetTabTextActive: {
    color: "#93c5fd",
  },
  sheetMeta: {
    marginTop: 10,
    color: "#9ca3af",
    fontSize: 12,
  },
  sheetBodyText: {
    marginTop: 10,
    color: "#e5e7eb",
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 16,
  },
});
