import { initAgent } from "@/lib/ai-agents/base-agent";
import { openai } from "@ai-sdk/openai";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await initAgent();
  if (!result) return;
  const { agent, config } = result;

  // Convert OpenAI-style messages to LangChain messages
  const langChainMessages = messages
    .map((msg: { role: string; content: string }) => {
      if (msg.role === "user") {
        return new HumanMessage(msg.content);
      } else if (msg.role === "assistant") {
        return new AIMessage(msg.content);
      }
      return null;
    })
    .filter(Boolean);

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
