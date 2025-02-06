import { initAgent } from "@/lib/ai-agents/base-agent";
import { openai } from "@ai-sdk/openai";
import { HumanMessage } from "@langchain/core/messages";
import { streamText } from "ai";

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

  for await (const chunk of stream) {
    if ("agent" in chunk) {
      console.log(chunk.agent.messages[0].content);
    } else if ("tools" in chunk) {
      console.log(chunk.tools.messages[0].content);
    }
    console.log("-------------------");
  }
}
