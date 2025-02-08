import { initAgent } from "@/lib/ai-agents/base-agent";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { prompt } from "@/lib/ai-agents/prompts";
import rateLimit from "@/lib/rate-limit";

const limiter = rateLimit({
  interval: 86400000, // 24 hours in milliseconds
  limit: 200, // 200 requests per day
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await limiter.check(req as any, 200, ip);

    const body = await req.json();
    const userWalletAddress =
      body.userWalletAddress || process.env.USER_WALLET_ADDRESS;
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
  } catch (error) {
    if (error instanceof Error && error.message === "Rate limit exceeded") {
      return new Response(
        JSON.stringify({
          error: "Too many requests. Please try again tomorrow.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
