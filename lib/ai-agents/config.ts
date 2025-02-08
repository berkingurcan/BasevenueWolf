export const AI_CONFIG = {
  model: "gpt-4o-mini", // or your preferred model
  temperature: 0.2,
  maxTokens: 4096,
};

export const config = {
  apiKeyName: process.env.CDP_API_KEY_NAME,
  apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  networkId: process.env.NETWORK_ID || "base-sepolia",
  mnemonicPhrase: process.env.MNEMONIC_PHRASE,
};
