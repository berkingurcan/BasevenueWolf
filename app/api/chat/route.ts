import { initAgent } from "@/lib/ai-agents/base-agent";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { prompt } from "@/lib/ai-agents/prompts";
import { use } from "chai";

export async function POST(req: Request) {
  const body = await req.json();
  const userWalletAddress =
    body.userWalletAddress || "0x5e7EC86C282BFF4583C80E5b275fc10246d19dBD";
  const { messages } = body;

  const result = await initAgent();
  if (!result) return;
  const { agent, config } = result;

  // Convert OpenAI-style messages to LangChain messages
  messages.unshift({ role: "system", content: prompt(userWalletAddress) });

  const langChainMessages = messages
    .map((msg: { role: string; content: string }) => {
      if (msg.role === "user") {
        return new HumanMessage(msg.content);
      } else if (msg.role === "assistant") {
        return new AIMessage(msg.content);
      } else if (msg.role === "system") {
        return new SystemMessage(msg.content);
      }
      return null;
    })
    .filter(Boolean);

  console.log(messages);
  const stream = await agent.stream({ messages: langChainMessages }, config);

  console.log(stream);

  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            let content = "";
            if ("agent" in chunk) {
              content = chunk.agent.messages[0].content;
            } else if ("tools" in chunk) {
              content = chunk.tools.messages[0].content;
            }

            if (content) {
              controller.enqueue(`data: ${JSON.stringify({ content })}\n\n`);
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    },
  );
}
