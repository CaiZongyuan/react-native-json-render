import { generateAPIUrl } from "@/src/utils/urlGenerator";
import { TodoAssistantCard } from "@/src/components/chatbot/TodoAssistantCard";
import { TODO_UI_TOOL_NAME } from "@/src/lib/todolist/todoAssistantTool";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { fetch as expoFetch } from "expo/fetch";
import { useCallback, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

const QUICK_PROMPTS = [
  "What is React Native?",
  "Explain Expo Router",
  "How to use Tailwind in React Native?",
  "What is JSON rendering?",
  "Show my todo list and suggest tasks",
];
// Approximate tab bar height
const TAB_BAR_HEIGHT = 50;

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export default function Chatbot() {
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const { messages, error, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      fetch: expoFetch as unknown as typeof globalThis.fetch,
      api: generateAPIUrl("/api/chatbot"),
    }),
    onError: (error) => console.error(error, "ERROR"),
  });

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || status === "streaming") return;

    sendMessage({ text: trimmed });
    setInput("");
  }, [input, sendMessage, status]);

  const isStreaming = status === "submitted" || status === "streaming";

  const renderMessage = useCallback(
    ({ item }: { item: UIMessage }) => {
      const isUser = item.role === "user";
      const isSystem = item.role === "system";

      if (isSystem) return null;

      const text = getMessageText(item);
      const todoToolParts = item.parts.filter(
        (p) => p.type === `tool-${TODO_UI_TOOL_NAME}`,
      ) as unknown as {
        toolCallId: string;
        state: string;
        input?: unknown;
        output?: unknown;
        errorText?: string;
      }[];

      return (
        <View className="my-1.5">
          {!!text && (
            <View
              className={`px-3 py-2.5 rounded-2xl max-w-[85%] ${
                isUser
                  ? "bg-gray-200 self-end"
                  : "bg-[#1f2937] border border-[#243041] self-start"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  isUser ? "text-[#0b0f19]" : "text-gray-200"
                }`}
              >
                {text}
              </Text>
            </View>
          )}

          {!isUser &&
            todoToolParts.map((part) => {
              if (part.state === "output-available") {
                return (
                  <View key={part.toolCallId} className="self-start max-w-[92%]">
                    <TodoAssistantCard
                      state={part.state}
                      input={part.input}
                      output={part.output}
                      loading={isStreaming}
                    />
                  </View>
                );
              }

              if (part.state === "output-error") {
                return (
                  <View
                    key={part.toolCallId}
                    className="self-start mt-2 rounded-2xl border border-[#243041] bg-[#111827] p-3 max-w-[92%]"
                  >
                    <Text className="text-red-400 text-xs font-bold">
                      Todo tool error
                    </Text>
                    <Text className="text-gray-400 text-xs mt-1">
                      {part.errorText ?? "Unknown error"}
                    </Text>
                  </View>
                );
              }

              return (
                <View key={part.toolCallId} className="self-start max-w-[92%]">
                  <TodoAssistantCard
                    state={part.state}
                    input={part.input}
                    loading
                  />
                </View>
              );
            })}
        </View>
      );
    },
    [isStreaming],
  );

  const nonSystemCount = messages.filter((m) => m.role !== "system").length;

  const renderListEmptyComponent = useCallback(() => {
    if (nonSystemCount > 0) return null;
    if (nonSystemCount > 0) return null;

    return (
      <View className="flex-1 justify-center items-center px-6">
        <View className="rounded-xl border border-[#243041] bg-[#111827] p-6">
          <Text className="text-gray-200 font-extrabold text-lg mb-2 text-center">
            AI Chatbot
          </Text>
          <Text className="text-gray-400 text-center mb-4">
            Ask me anything about React Native, Expo, or development!
          </Text>
          <View className="gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <Pressable
                key={prompt}
                onPress={() => setInput(prompt)}
                disabled={isStreaming}
                className="py-2 px-3 rounded-xl border border-[#243041] bg-[#0f172a]"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : isStreaming ? 0.5 : 1,
                })}
              >
                <Text className="text-gray-200 font-bold text-xs">
                  {prompt}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    );
  }, [nonSystemCount, isStreaming]);

  if (error) {
    return (
      <View className="flex-1 bg-[#0b0f19] justify-center items-center p-4">
        <Text className="text-red-400 font-extrabold text-lg mb-2">Error</Text>
        <Text className="text-gray-400 text-center">{error.message}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View className="flex-1 px-3">
        {/* Header */}
        <View className="py-3 border-b border-[#243041]">
          <Text className="text-gray-200 text-xl font-extrabold">Chat</Text>
          <Text className="text-gray-400 text-xs mt-0.5">
            Ask anything, get instant answers
          </Text>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerClassName="flex-grow py-2"
          contentContainerStyle={{ paddingBottom: 8 }}
          ListEmptyComponent={renderListEmptyComponent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
          onLayout={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
        />
      </View>

      {/* Input Area - with padding for tab bar */}
      <View
        className="px-3 pb-3 pt-2"
        style={{ paddingBottom: TAB_BAR_HEIGHT + 12 }}
      >
        <View className="flex-row items-end gap-2">
          <TextInput
            className="flex-1 bg-[#0f172a] border border-[#243041] rounded-xl py-3 px-4 text-gray-200 min-h-[44px]"
            placeholder="Message AI..."
            placeholderTextColor="#6b7280"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            editable={!isStreaming}
            multiline
            textAlignVertical="top"
          />
          <Pressable
            onPress={handleSend}
            disabled={isStreaming || !input.trim()}
            className={`py-3 px-4 rounded-xl justify-center items-center min-w-[70px] ${
              isStreaming || !input.trim()
                ? "bg-[#1f2937] opacity-50"
                : "bg-gray-200"
            }`}
          >
            <Text
              className={`font-extrabold text-sm ${
                isStreaming || !input.trim()
                  ? "text-gray-500"
                  : "text-[#0b0f19]"
              }`}
            >
              {isStreaming ? "..." : "Send"}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
