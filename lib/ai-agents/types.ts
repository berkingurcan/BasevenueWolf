import { ChatCompletionMessage } from "openai/resources/chat/completions";
import { tool } from "ai";

export type AgentRole = "WALLET_MANAGER" | "TOKEN_MANAGER" | "PRODUCT_MANAGER";

export interface AgentConfig {
  systemPrompt: string;
  tools: AgentTool[];
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required: string[];
  };
  handler: (params: any) => Promise<any>;
}

export interface AgentContext {
  messages: ChatCompletionMessage[];
  tools?: AgentTool[];
}
