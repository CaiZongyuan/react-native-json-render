import {
  dashboardRegistry,
  UnknownComponent,
} from "@/src/components/dashboard/registry";
import { useDashboardTreeStream } from "@/src/hooks/useDashboardTreeStream";
import { INITIAL_DATA } from "@/src/lib/dashboard/initialData";
import {
  MOCK_PATCHES_DASHBOARD,
  MOCK_PATCHES_TABLE_ONLY,
} from "@/src/lib/dashboard/mockPatches";
import { createSystemPrompt } from "@/src/lib/dashboard/systemPrompt";
import { generateAPIUrl } from "@/src/utils/urlGenerator";
import { useChat } from "@ai-sdk/react";
import { Renderer, useActions } from "@json-render/react";
import { DefaultChatTransport } from "ai";
import { fetch as expoFetch } from "expo/fetch";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

export default function Dashboard() {
  const [prompt, setPrompt] = useState("");
  const [isOutputSheetOpen, setIsOutputSheetOpen] = useState(false);
  const [outputTab, setOutputTab] = useState<"patches" | "tree">("patches");
  const [showDoneBanner, setShowDoneBanner] = useState(false);
  const [doneBannerText, setDoneBannerText] = useState("Generation complete");

  const prevStatusRef = useRef<string | null>(null);
  const doneBannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

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
    setDoneBannerText("Generation complete");
    if (doneBannerTimeoutRef.current) {
      clearTimeout(doneBannerTimeoutRef.current);
      doneBannerTimeoutRef.current = null;
    }

    setMessages([
      {
        id: createId("system"),
        role: "system",
        parts: [{ type: "text", text: createSystemPrompt() }],
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

  const loadMock = useCallback(
    (variant: "dashboard" | "table") => {
      stop();
      reset();

      const mockText =
        variant === "dashboard"
          ? MOCK_PATCHES_DASHBOARD
          : MOCK_PATCHES_TABLE_ONLY;

      setMessages([
        {
          id: createId("assistant"),
          role: "assistant",
          parts: [{ type: "text", text: mockText }],
        },
      ]);

      setDoneBannerText("Mock loaded");
      setShowDoneBanner(true);
      if (doneBannerTimeoutRef.current)
        clearTimeout(doneBannerTimeoutRef.current);
      doneBannerTimeoutRef.current = setTimeout(() => {
        setShowDoneBanner(false);
      }, 2000);
    },
    [stop, reset, setMessages],
  );

  const clear = useCallback(() => {
    stop();
    reset();
    setMessages([]);
  }, [stop, reset, setMessages]);

  const hasElements = !!tree && Object.keys(tree.elements).length > 0;

  const treeStats = useMemo(() => {
    if (!tree) return null;

    const allKeys = Object.keys(tree.elements);
    const reachable = new Set<string>();
    const missingChildRefs: { parent: string; child: string }[] = [];

    for (const key of allKeys) {
      const el = tree.elements[key];
      const children = el?.children ?? [];
      for (const childKey of children) {
        if (!tree.elements[childKey]) {
          missingChildRefs.push({ parent: key, child: childKey });
        }
      }
    }

    if (tree.root && tree.elements[tree.root]) {
      const queue: string[] = [tree.root];
      while (queue.length) {
        const k = queue.shift()!;
        if (reachable.has(k)) continue;
        reachable.add(k);
        const el = tree.elements[k];
        const children = el?.children ?? [];
        for (const childKey of children) {
          if (tree.elements[childKey] && !reachable.has(childKey)) {
            queue.push(childKey);
          }
        }
      }
    }

    const orphanCount = allKeys.filter((k) => !reachable.has(k)).length;
    return {
      total: allKeys.length,
      reachable: reachable.size,
      orphanCount,
      missingChildRefs,
    };
  }, [tree]);

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    if (!prev) return;

    const completedNow =
      (prev === "submitted" || prev === "streaming") && status === "ready";
    if (completedNow && hasElements && !parseError && !error) {
      setDoneBannerText("Generation complete");
      setShowDoneBanner(true);
      if (doneBannerTimeoutRef.current)
        clearTimeout(doneBannerTimeoutRef.current);
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
    <>
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

        <View
          style={{
            flexDirection: "row",
            marginTop: 10,
            alignItems: "center",
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
          >
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
                <Text
                  style={{
                    color: "#e5e7eb",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {p}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            onPress={() => loadMock("dashboard")}
            style={{
              marginLeft: 10,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#243041",
            }}
          >
            <Text
              style={{
                color: "#e5e7eb",
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              Mock
            </Text>
          </Pressable>

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
            <Text
              style={{
                color: "#e5e7eb",
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              AI JSON
            </Text>
          </Pressable>
        </View>

        {showDoneBanner && (
          <View style={styles.doneBanner}>
            <Text style={styles.doneBannerText}>{doneBannerText}</Text>
            <Pressable onPress={() => setIsOutputSheetOpen(true)}>
              <Text style={styles.doneBannerLink}>View output</Text>
            </Pressable>
          </View>
        )}

        <ScrollView
          style={{ flex: 1, marginTop: 12 }}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {!!tree && !tree.root && (
            <View
              style={{
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#7f1d1d",
                padding: 12,
                backgroundColor: "#3a1414",
                marginBottom: 12,
              }}
            >
              <Text style={{ color: "#fecaca", fontWeight: 800 }}>
                Tree has no root yet
              </Text>
              <Text style={{ color: "#fecaca", marginTop: 6 }}>
                Open AI JSON to inspect patch output.
              </Text>
            </View>
          )}

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
                Try: &quot;Revenue dashboard with metrics and chart&quot;
              </Text>
              <Text style={{ color: "#9ca3af", marginTop: 6 }}>
                Or: &quot;Recent transactions table&quot;
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

          <View style={{ flexDirection: "row", marginTop: 10 }}>
            <Pressable
              onPress={() => loadMock("dashboard")}
              style={[styles.sheetTab, { marginRight: 8 }]}
            >
              <Text style={styles.sheetTabText}>Load mock dashboard</Text>
            </Pressable>
            <Pressable
              onPress={() => loadMock("table")}
              style={styles.sheetTab}
            >
              <Text style={styles.sheetTabText}>Load mock table</Text>
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
            {treeStats ? ` · elements: ${treeStats.total}` : ""}
            {treeStats ? ` · reachable: ${treeStats.reachable}` : ""}
            {treeStats ? ` · orphans: ${treeStats.orphanCount}` : ""}
            {treeStats && treeStats.missingChildRefs.length
              ? ` · missingChildren: ${treeStats.missingChildRefs.length}`
              : ""}
          </Text>

          {treeStats && treeStats.missingChildRefs.length > 0 && (
            <Text style={[styles.sheetMeta, { marginTop: 6 }]}>
              Missing refs (sample):{" "}
              {treeStats.missingChildRefs
                .slice(0, 3)
                .map((r) => `${r.parent}->${r.child}`)
                .join(", ")}
              {treeStats.missingChildRefs.length > 3 ? " ..." : ""}
            </Text>
          )}

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
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
    </>
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
