import {
  AgentKit,
  CdpWalletProvider,
  wethActionProvider,
  walletActionProvider,
  erc20ActionProvider,
} from "@coinbase/agentkit";

import { tokenManagerActionProvider } from "./tokenManagerProvider";
import { productManagerProvider } from "./productManagerProvider";
import { bridgeActionProvider } from "./bridgeProvider";

import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";

import * as fs from "fs";
import * as readline from "readline";
import { config } from "./config";
import dotenv from "dotenv";

dotenv.config({ path: `.env.local`, override: true });

async function initAgent() {
  try {
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const walletProvider = await CdpWalletProvider.configureWithWallet(config);
    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        wethActionProvider(),
        walletActionProvider(),
        erc20ActionProvider(),
        tokenManagerActionProvider(),
        productManagerProvider(),
        bridgeActionProvider(),
      ],
    });

    const agentConfig = { configurable: { thread_id: "BasevenueWolf!" } };

    const tools = await getLangChainTools(agentkit);
    const agent = createReactAgent({
      llm,
      tools,
    });

    return { agent, config: agentConfig };
  } catch (error) {
    console.error(error);
  }
}

async function main() {
  const result = await initAgent();
  if (!result) return;
  const { agent, config } = result;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const userInput = await new Promise<string>((resolve) => {
    rl.question("Enter your message: ", resolve);
  });
  rl.close();

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

main();

export { initAgent };

// NODE_OPTIONS='--loader ts-node/esm' node --experimental-specifier-resolution=node lib/ai-agents/base-agent.ts
