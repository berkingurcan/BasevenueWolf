import { ChatCompletionMessage } from 'openai/resources/chat';
import { AgentConfig, AgentContext, AgentTool } from './types';

export class BaseAgent {
  protected config: AgentConfig;
  protected context: AgentContext;

  constructor(config: AgentConfig) {
    this.config = config;
    this.context = {
      messages: [
        {
          role: 'system',
          content: config.systemPrompt,
        },
      ],
      tools: config.tools,
    };
  }

  // TODO: Implement message handling with Vercel AI SDK
  async processMessage(message: string): Promise<string> {
    throw new Error('Not implemented');
  }

  // TODO: Implement tool execution
  protected async executeTool(toolName: string, params: any): Promise<any> {
    throw new Error('Not implemented');
  }

  // TODO: Implement context management
  protected updateContext(message: ChatCompletionMessage) {
    this.context.messages.push(message);
  }
} 