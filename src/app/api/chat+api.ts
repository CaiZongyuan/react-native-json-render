import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { convertToModelMessages, streamText, UIMessage } from "ai";

const glm = createOpenAICompatible({
  name: "glm",
  baseURL: "https://open.bigmodel.cn/api/coding/paas/v4",
  apiKey: process.env.GLM_API_KEY,
});
export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: glm.chatModel("glm-4.7"),
    messages: await convertToModelMessages(messages),
    providerOptions: {
      glm: {
        thinking: { type: "disabled" },
      },
    },
    // onChunk: ({ chunk }) => {
    //   console.log("Chunk:", chunk);
    // },
  });

  return result.toUIMessageStreamResponse({
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "none",
    },
  });
}
