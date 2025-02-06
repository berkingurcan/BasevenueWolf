import { initAgent } from "@/lib/ai-agents/base-agent";
import { openai } from "@ai-sdk/openai";
import { HumanMessage } from "@langchain/core/messages";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await initAgent();
  if (!result) return;
  const { agent, config } = result;
  const userInput = messages[messages.length - 1].content;

  const stream = await agent.stream(
    { messages: [new HumanMessage(userInput)] },
    config,
  );

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
              controller.enqueue(
                `data: ${JSON.stringify({ content })}\n\n`
              );
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    }), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    }
  );
}
