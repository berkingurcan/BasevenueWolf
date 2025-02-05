import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export async function POST(req: Request) {
  try {
    const { publicKey, prompt, action, parameters } = await req.json();

    if (!publicKey || !prompt) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Validate action type
    const validActions = ["tokenomics", "minting", "product-economics"];
    if (action && !validActions.includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action type" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Prepare context based on action
    let systemContext = "";
    switch (action) {
      case "tokenomics":
        systemContext =
          "You are a tokenomics expert. Analyze and provide recommendations for token distribution, vesting, and utility based on the given parameters.";
        break;
      case "minting":
        systemContext =
          "You are a minting specialist. Provide guidance on token minting strategy, supply management and distribution mechanics.";
        break;
      case "product-economics":
        systemContext =
          "You are a product-token integration expert. Analyze how the main token can be integrated with products, including pricing, rewards, and token flow.";
        break;
      default:
        systemContext =
          "You are a token management expert. Provide guidance on general token management strategy.";
    }

    // Generate AI response
    const result = streamText({
      model: openai("gpt-4"),
      system: systemContext,
      messages: [
        {
          role: "user",
          content: `Public Key: ${publicKey}\nPrompt: ${prompt}\nParameters: ${JSON.stringify(parameters)}`,
        },
      ],
    });

    return result.toDataStreamResponse();
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid request data" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
