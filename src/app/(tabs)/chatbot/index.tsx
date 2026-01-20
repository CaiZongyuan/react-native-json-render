import { generateAPIUrl } from "@/src/utils/urlGenerator";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { fetch as expoFetch } from "expo/fetch";
import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function App() {
  const [input, setInput] = useState("");
  const { messages, error, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      fetch: expoFetch as unknown as typeof globalThis.fetch,
      api: generateAPIUrl("/api/chat"),
    }),
    onError: (error) => console.error(error, "ERROR"),
  });

  if (error) return <Text>{error.message}</Text>;

  return (
    <SafeAreaView className="h-full">
      <View className="h-[95%] flex flex-col px-2">
        <ScrollView className="flex-1">
          {messages.map((m) => (
            <View key={m.id} className="my-2">
              <View>
                <Text className="font-bold">{m.role}</Text>
                {m.parts.map((part, i) => {
                  switch (part.type) {
                    case "text":
                      return <Text key={`${m.id}-${i}`}>{part.text}</Text>;
                  }
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        <View className="mt-2">
          <TextInput
            className="bg-white p-2"
            placeholder="Say something..."
            value={input}
            onChange={(e) => setInput(e.nativeEvent.text)}
            onSubmitEditing={(e) => {
              e.preventDefault();
              sendMessage({ text: input });
              setInput("");
            }}
            autoFocus={true}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
