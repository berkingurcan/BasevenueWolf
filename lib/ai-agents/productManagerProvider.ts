import { AgentConfig } from "./types";
import { ActionProvider, Network } from "@coinbase/agentkit";

export class ProductManagerAgent extends ActionProvider {
  supportsNetwork(network: Network): boolean {
    throw new Error("Method not implemented.");
  }
}
