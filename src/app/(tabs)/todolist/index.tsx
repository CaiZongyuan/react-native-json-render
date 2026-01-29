import {
  todolistRegistry,
  UnknownComponent,
} from "@/src/components/todolist/registry";
import { useTodolistTreeStream } from "@/src/hooks/useTodolistTreeStream";
import { INITIAL_DATA } from "@/src/lib/todolist/initialData";
import { MOCK_PATCHES_TODOLIST } from "@/src/lib/todolist/mockPatches";
import { createSystemPrompt } from "@/src/lib/todolist/systemPrompt";
import { generateAPIUrl } from "@/src/utils/urlGenerator";
import { useChat } from "@ai-sdk/react";
import { Renderer, useActions } from "@json-render/react";
import type { UITree } from "@json-render/core";
import { DefaultChatTransport } from "ai";
import { fetch as expoFetch } from "expo/fetch";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function RNConfirmDialogManager() {
  const { pendingConfirmation, confirm, cancel } = useActions();
  const lastKeyRef = useRef<string | null>(null);

  React.useEffect(() => {
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

const DEMO_TREE: UITree = {
  root: "root",
  elements: {
    root: {
      key: "root",
      type: "Stack",
      props: { gap: "lg" },
      children: ["section1", "section2", "section3", "section4", "section5"],
    },
    section1: {
      key: "section1",
      type: "Stack",
      props: { gap: "md" },
      children: ["title1", "text1", "text2"],
    },
    title1: {
      key: "title1",
      type: "Title",
      props: { text: "TodoList Components" },
    },
    text1: {
      key: "text1",
      type: "Text",
      props: {
        content: "Welcome to the TodoList JSON-render demo. These are the available components:",
      },
    },
    text2: {
      key: "text2",
      type: "Text",
      props: {
        content: "Title, Text, Table, Checkbox, Button, Confirm, Waiting, Input, Stack",
        variant: "muted",
      },
    },
    section2: {
      key: "section2",
      type: "Stack",
      props: { gap: "md" },
      children: ["title2", "table1"],
    },
    title2: {
      key: "title2",
      type: "Title",
      props: { text: "Todo Table" },
    },
    table1: {
      key: "table1",
      type: "Table",
      props: { dataPath: "/todos" },
    },
    section3: {
      key: "section3",
      type: "Stack",
      props: { gap: "md" },
      children: ["title3", "checkbox1", "checkbox2", "input1"],
    },
    title3: {
      key: "title3",
      type: "Title",
      props: { text: "Form Controls" },
    },
    checkbox1: {
      key: "checkbox1",
      type: "Checkbox",
      props: { label: "Show completed tasks", bindPath: "/settings/showCompleted" },
    },
    checkbox2: {
      key: "checkbox2",
      type: "Checkbox",
      props: { label: "Enable notifications", bindPath: "/settings/notifications" },
    },
    input1: {
      key: "input1",
      type: "Input",
      props: {
        label: "New Todo",
        bindPath: "/form/newTodo",
        placeholder: "Enter a new todo...",
      },
    },
    section4: {
      key: "section4",
      type: "Stack",
      props: { gap: "sm" },
      children: ["title4", "btnRow"],
    },
    title4: {
      key: "title4",
      type: "Title",
      props: { text: "Buttons & Actions" },
    },
    btnRow: {
      key: "btnRow",
      type: "Stack",
      props: { gap: "sm" },
      children: ["btn1", "btn2", "btn3"],
    },
    btn1: {
      key: "btn1",
      type: "Button",
      props: { label: "Primary", variant: "primary", action: "doSomething" },
    },
    btn2: {
      key: "btn2",
      type: "Button",
      props: { label: "Secondary", variant: "secondary", action: "doOther" },
    },
    btn3: {
      key: "btn3",
      type: "Confirm",
      props: {
        label: "Delete All",
        action: "deleteAll",
        confirm: {
          title: "Delete All Todos",
          message: "This action cannot be undone. Continue?",
        },
      },
    },
    section5: {
      key: "section5",
      type: "Stack",
      props: { gap: "sm" },
      children: ["title5", "waiting1", "text3", "text4", "text5"],
    },
    title5: {
      key: "title5",
      type: "Title",
      props: { text: "Text Variants" },
    },
    waiting1: {
      key: "waiting1",
      type: "Waiting",
      props: { text: "Syncing..." },
    },
    text3: {
      key: "text3",
      type: "Text",
      props: { content: "Default text style", variant: "default" },
    },
    text4: {
      key: "text4",
      type: "Text",
      props: { content: "Success message", variant: "success" },
    },
    text5: {
      key: "text5",
      type: "Text",
      props: { content: "Warning message", variant: "warning" },
    },
  },
};

export default function TodoList() {
  const [prompt, setPrompt] = useState("");
  const [showOutputModal, setShowOutputModal] = useState(false);
  const [showDoneBanner, setShowDoneBanner] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const doneBannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { messages, setMessages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      fetch: expoFetch as unknown as typeof globalThis.fetch,
      api: generateAPIUrl("/api/chat"),
    }),
    experimental_throttle: 50,
  });

  const { tree, reset } = useTodolistTreeStream(messages);

  const isStreaming = status === "submitted" || status === "streaming";

  const start = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    stop();
    reset();
    setShowDoneBanner(false);

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

  const loadMock = useCallback(() => {
    stop();
    reset();

    setMessages([
      {
        id: createId("assistant"),
        role: "assistant",
        parts: [{ type: "text", text: MOCK_PATCHES_TODOLIST }],
      },
    ]);

    setShowDoneBanner(true);
    if (doneBannerTimeoutRef.current)
      clearTimeout(doneBannerTimeoutRef.current);
    doneBannerTimeoutRef.current = setTimeout(() => {
      setShowDoneBanner(false);
    }, 2000);
  }, [stop, reset, setMessages]);

  const clear = useCallback(() => {
    stop();
    reset();
    setMessages([]);
  }, [stop, reset, setMessages]);

  React.useEffect(() => {
    return () => {
      if (doneBannerTimeoutRef.current) {
        clearTimeout(doneBannerTimeoutRef.current);
      }
    };
  }, []);

  // Use demo tree or generated tree
  const displayTree = tree ?? DEMO_TREE;
  const hasElements = Object.keys(displayTree.elements).length > 0;
  const isDemo = !tree;
  const loadingState = isDemo ? demoLoading : isStreaming;

  return (
    <>
      <RNConfirmDialogManager />
      <View className="flex-1 p-4">
        <View className="flex-row justify-between items-start">
          <View>
            <Text className="text-gray-200 text-2xl font-extrabold">
              TodoList
            </Text>
            <Text className="text-gray-400 mt-1.5">
              JSON-render component showcase
            </Text>
          </View>
        </View>

        <View className="flex-row mt-3">
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Describe a todo list..."
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
          {isDemo && (
            <Pressable
              onPress={() => setDemoLoading(!demoLoading)}
              className="py-2 px-2.5 rounded-full border border-[#243041]"
            >
              <Text className="text-gray-200 font-extrabold text-xs">
                {demoLoading ? "Stop Demo" : "Demo Loading"}
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={loadMock}
            disabled={isStreaming}
            className={`py-2 px-2.5 rounded-full border border-[#243041] ${isDemo ? "ml-2.5" : ""}`}
          >
            <Text className="text-gray-200 font-extrabold text-xs">
              Load Mock
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setShowOutputModal(true)}
            className="ml-2.5 py-2 px-3 rounded-xl border border-[#243041]"
          >
            <Text className="text-gray-200 font-extrabold text-xs">
              View JSON
            </Text>
          </Pressable>
        </View>

        {showDoneBanner && (
          <View className="mt-2.5 py-2.5 px-3 rounded-xl border border-[#14532d] bg-[#052e16] flex-row justify-between items-center">
            <Text className="text-[#bbf7d0] font-extrabold">
              {tree ? "Mock loaded" : "Showing demo components"}
            </Text>
          </View>
        )}

        <ScrollView
          className="flex-1 mt-3"
          contentContainerClassName="pb-6"
        >
          {hasElements ? (
            <Renderer
              tree={displayTree}
              registry={todolistRegistry}
              loading={loadingState}
              fallback={UnknownComponent}
            />
          ) : (
            <View className="rounded-xl border border-[#243041] p-4 bg-[#111827]">
              <Text className="text-gray-400">No components to display</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Bottom Sheet */}
      {showOutputModal && (
        <>
          <Pressable
            className="absolute inset-0 bg-black/55 z-40"
            onPress={() => setShowOutputModal(false)}
          />
          <Animated.View
            className="absolute left-0 right-0 bottom-0 z-50 max-h-[78%] bg-[#0b0f19] rounded-t-2xl border-x border-t border-[#243041] p-3.5"
            style={{
              transform: [{ translateY: 0 }],
            }}
          >
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-200 font-black text-base">UI Tree</Text>
              <Pressable onPress={() => setShowOutputModal(false)}>
                <Text className="text-gray-400 font-extrabold">Close</Text>
              </Pressable>
            </View>

            <ScrollView className="flex-1 mt-3" contentContainerClassName="pb-6">
              <Text selectable className="text-gray-200 font-mono text-xs leading-4">
                {JSON.stringify(displayTree, null, 2)}
              </Text>
            </ScrollView>
          </Animated.View>
        </>
      )}
    </>
  );
}
