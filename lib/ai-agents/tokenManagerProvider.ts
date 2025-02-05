import { ActionProvider, Network } from "@coinbase/agentkit";

class TokenManagerActionProvider extends ActionProvider {
  supportsNetwork(network: Network): boolean {
    throw new Error("Method not implemented.");
  }
}

export { TokenManagerActionProvider };
