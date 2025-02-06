import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import {
  createPublicClient,
  decodeAbiParameters,
  http,
  keccak256,
  toBytes,
} from "viem";
import { base } from "viem/chains";
import os from "os";
import dotenv from "dotenv";

dotenv.config();

// https://developers.circle.com/stablecoins/evm-smart-contracts contains the CCTP contract addresses
export const BASE_TOKEN_MESSENGER_ADDRESS =
  "0x1682Ae6375C4E4A97e4B583BC394c861A46D8962";
export const ARBITRUM_MESSAGE_TRANSMITTER_ADDRESS =
  "0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca";

// https://developers.circle.com/stablecoins/usdc-on-main-networks contains the USDC contract addresses on chains
export const USDC_BASE_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export const tokenMessengerAbi = [
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint32", name: "destinationDomain", type: "uint32" },
      { internalType: "bytes32", name: "mintRecipient", type: "bytes32" },
      { internalType: "address", name: "burnToken", type: "address" },
    ],
    name: "depositForBurn",
    outputs: [{ internalType: "uint64", name: "_nonce", type: "uint64" }],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export const messageTransmitterAbi = [
  {
    inputs: [
      { internalType: "bytes", name: "message", type: "bytes" },
      { internalType: "bytes", name: "attestation", type: "bytes" },
    ],
    name: "receiveMessage",
    outputs: [{ internalType: "bool", name: "success", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export async function bridgeUSDC(
  baseWallet: any,
  arbitrumWallet: any,
  usdcAmount: any,
) {
  const baseUSDCBalance = await baseWallet.getBalance("usdc");
  const arbitrumUSDCBalance = await arbitrumWallet.getBalance("usdc");
  console.log(
    "Base USDC initial balance:",
    baseUSDCBalance,
    "| Arbitrum USDC initial balance:",
    arbitrumUSDCBalance,
  );

  const arbitrumRecipientAddress = padAddress(
    (await arbitrumWallet.getDefaultAddress()).getId(),
  );

  const approveTx = await baseWallet.invokeContract({
    contractAddress: USDC_BASE_ADDRESS,
    method: "approve",
    args: {
      spender: BASE_TOKEN_MESSENGER_ADDRESS,
      value: usdcAmount.toString(),
    },
  });
  await approveTx.wait();
  console.log("Approve transaction completed:", approveTx.getTransactionHash());

  const depositTx = await baseWallet.invokeContract({
    contractAddress: BASE_TOKEN_MESSENGER_ADDRESS,
    method: "depositForBurn",
    args: {
      amount: usdcAmount.toString(), // uint256 as string
      destinationDomain: "3", // uint32 as string
      mintRecipient: arbitrumRecipientAddress, // already padded bytes32 as hex string
      burnToken: USDC_BASE_ADDRESS,
    },
    abi: tokenMessengerAbi,
  });
  await depositTx.wait();
  console.log("Deposit transaction completed:", depositTx.getTransactionHash());

  const transactionReceipt = await getTransactionReceipt(
    depositTx.getTransactionHash(),
  );
  const eventTopic = keccak256(toBytes("MessageSent(bytes)"));
  const log = transactionReceipt.logs.find((l) => l.topics[0] === eventTopic);
  if (!log) {
    throw new Error("MessageSent event not found in transaction logs");
  }
  const messageBytes = decodeAbiParameters([{ type: "bytes" }], log.data)[0];
  const messageHash = keccak256(messageBytes);
  console.log("Message hash:", messageHash);

  let attestationResponse: any = { status: "pending" };
  while (attestationResponse.status != "complete") {
    const response = await fetch(
      `https://iris-api.circle.com/attestations/${messageHash}`,
    );
    attestationResponse = await response.json();
    await new Promise((r) => setTimeout(r, 2000));
  }

  const attestationSignature = attestationResponse.attestation;
  console.log(
    "Received attestation signature from Circle's Iris service:",
    attestationSignature,
  );

  const receiveMessageTx = await arbitrumWallet.invokeContract({
    contractAddress: ARBITRUM_MESSAGE_TRANSMITTER_ADDRESS,
    method: "receiveMessage",
    args: {
      message: messageBytes,
      attestation: attestationSignature,
    },
    abi: messageTransmitterAbi,
  });
  await receiveMessageTx.wait();
  console.log(
    "Receive message transaction completed:",
    receiveMessageTx.getTransactionHash(),
  );

  const finalBaseUSDCBalance = await baseWallet.getBalance("usdc");
  const finalArbitrumUSDCBalance = await arbitrumWallet.getBalance("usdc");
  console.log(
    "Base USDC final balance:",
    finalBaseUSDCBalance,
    "| Arbitrum USDC final balance:",
    finalArbitrumUSDCBalance,
  );
}

function padAddress(address: any) {
  address = address.replace(/^0x/, "");
  return "0x" + address.padStart(64, "0");
}

async function getTransactionReceipt(txHash: any) {
  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });
  const receipt = await publicClient.getTransactionReceipt({
    hash: txHash,
  });
  return receipt;
}

// Helper function to fetch and load a wallet from a seed file
async function fetchWalletAndLoadSeed(walletId: any, seedFilePath: any) {
  try {
    const wallet = await Wallet.fetch(walletId);
    await wallet.loadSeed(seedFilePath);

    console.log(`Successfully loaded funded wallet: `, wallet.getId());
    return wallet;
  } catch (error) {
    console.error(
      `Error loading funded wallet ${walletId} from seed file ${seedFilePath}: `,
      error,
    );
  }
}
