import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export async function POST(req: Request) {
  try {
    const { publicKey, message } = await req.json();

    if (!publicKey || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const result = streamText({
      model: openai("gpt-4"),
      system: "You are a product expert. Help users understand product features and capabilities.",
      messages: [{
        role: "user", 
        content: `Public Key: ${publicKey}\nMessage: ${message}`
      }]
    });

    return result.toDataStreamResponse();

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request data' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

