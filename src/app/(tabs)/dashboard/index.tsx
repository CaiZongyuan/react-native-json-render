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
      <View className="flex-1 p-4">
        <View>
          <Text className="text-gray-200 text-2xl font-extrabold">
            Render
          </Text>
          <Text className="text-gray-400 mt-1.5">
            {headerSubtitle}
          </Text>
        </View>

        <View className="flex-row mt-3">
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Describe a revenue dashboard..."
            placeholderTextColor="#9ca3af"
            editable={!isStreaming}
            className="flex-1 bg-[#0f172a] border border-[#243041] rounded-xl py-2.5 px-3 text-gray-200"
            onSubmitEditing={(e) => {
              e.preventDefault();
              start();
            }}
          />
          <Pressable
            onPress={start}
            disabled={isStreaming || !prompt.trim()}
            className={`ml-2.5 py-2.5 px-3.5 rounded-xl bg-gray-200 justify-center ${isStreaming || !prompt.trim() ? "opacity-60" : "opacity-100"}`}
          >
            <Text className="text-[#0b0f19] font-extrabold">
              {isStreaming ? "..." : "Generate"}
            </Text>
          </Pressable>
          <Pressable
            onPress={clear}
            className="ml-2.5 py-2.5 px-3.5 rounded-xl border border-[#243041] justify-center"
          >
            <Text className="text-gray-200 font-extrabold">Clear</Text>
          </Pressable>
        </View>

        <View className="flex-row mt-2.5 items-center">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-1"
          >
            {QUICK_PROMPTS.map((p) => (
              <Pressable
                key={p}
                disabled={isStreaming}
                onPress={() => setPrompt(p)}
                className="mr-2 py-2 px-2.5 rounded-full border border-[#243041]"
                style={({ pressed }) => ({
                  backgroundColor: pressed ? "#0f172a" : "transparent",
                  opacity: isStreaming ? 0.5 : 1,
                })}
              >
                <Text className="text-gray-200 font-bold text-xs">
                  {p}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            onPress={() => loadMock("dashboard")}
            className="ml-2.5 py-2 px-3 rounded-xl border border-[#243041]"
          >
            <Text className="text-gray-200 font-extrabold text-xs">
              Mock
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setIsOutputSheetOpen(true)}
            className="ml-2.5 py-2 px-3 rounded-xl border border-[#243041]"
          >
            <Text className="text-gray-200 font-extrabold text-xs">
              AI JSON
            </Text>
          </Pressable>
        </View>

        {showDoneBanner && (
          <View className="mt-2.5 py-2.5 px-3 rounded-xl border border-[#14532d] bg-[#052e16] flex-row justify-between items-center">
            <Text className="text-[#bbf7d0] font-extrabold">{doneBannerText}</Text>
            <Pressable onPress={() => setIsOutputSheetOpen(true)}>
              <Text className="text-[#93c5fd] font-extrabold">View output</Text>
            </Pressable>
          </View>
        )}

        <ScrollView
          className="flex-1 mt-3"
          contentContainerClassName="pb-6"
        >
          {!!tree && !tree.root && (
            <View className="rounded-xl border border-[#7f1d1d] p-3 bg-[#3a1414] mb-3">
              <Text className="text-[#fecaca] font-extrabold">
                Tree has no root yet
              </Text>
              <Text className="text-[#fecaca] mt-1.5">
                Open AI JSON to inspect patch output.
              </Text>
            </View>
          )}

          {!hasElements ? (
            <View className="rounded-xl border border-[#243041] p-4 bg-[#111827]">
              <Text className="text-gray-400">
                Try: &quot;Revenue dashboard with metrics and chart&quot;
              </Text>
              <Text className="text-gray-400 mt-1.5">
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
          className="flex-1 bg-black/55"
          onPress={() => setIsOutputSheetOpen(false)}
        />
        <View className="absolute left-0 right-0 bottom-0 max-h-[78%] bg-[#0b0f19] rounded-t-2xl border-x border-t border-[#243041] p-3.5">
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-200 font-black text-base">AI Output</Text>
            <Pressable onPress={() => setIsOutputSheetOpen(false)}>
              <Text className="text-gray-400 font-extrabold">Close</Text>
            </Pressable>
          </View>

          <View className="flex-row mt-2.5">
            <Pressable
              onPress={() => loadMock("dashboard")}
              className="py-2 px-2.5 rounded-full border border-[#243041] mr-2"
            >
              <Text className="text-gray-200 font-extrabold text-xs">Load mock dashboard</Text>
            </Pressable>
            <Pressable
              onPress={() => loadMock("table")}
              className="py-2 px-2.5 rounded-full border border-[#243041]"
            >
              <Text className="text-gray-200 font-extrabold text-xs">Load mock table</Text>
            </Pressable>
          </View>

          <View className="flex-row mt-2.5">
            <Pressable
              onPress={() => setOutputTab("patches")}
              className={`py-2 px-2.5 rounded-full border border-[#243041] mr-2 ${outputTab === "patches" ? "bg-[#111827] border-[#60a5fa]" : ""}`}
            >
              <Text className={`text-gray-200 font-extrabold text-xs ${outputTab === "patches" ? "text-[#93c5fd]" : ""}`}>
                Patches
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setOutputTab("tree")}
              className={`py-2 px-2.5 rounded-full border border-[#243041] ${outputTab === "tree" ? "bg-[#111827] border-[#60a5fa]" : ""}`}
            >
              <Text className={`text-gray-200 font-extrabold text-xs ${outputTab === "tree" ? "text-[#93c5fd]" : ""}`}>
                Tree
              </Text>
            </Pressable>
          </View>

          <Text className="mt-2.5 text-gray-400 text-xs">
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
            <Text className="mt-1.5 text-gray-400 text-xs">
              Missing refs (sample):{" "}
              {treeStats.missingChildRefs
                .slice(0, 3)
                .map((r) => `${r.parent}->${r.child}`)
                .join(", ")}
              {treeStats.missingChildRefs.length > 3 ? " ..." : ""}
            </Text>
          )}

          <ScrollView
            className="flex-1"
            contentContainerClassName="pb-6"
          >
            <Text selectable className="mt-2.5 text-gray-200 font-mono text-xs leading-4">
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
