import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";

const configuredAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "";
export const CONTRACT_ADDRESS = /^0x[0-9a-fA-F]{40}$/.test(configuredAddress)
  ? configuredAddress as `0x${string}`
  : null;

export const EXPLORER = "https://explorer-bradbury.genlayer.com";
export const readClient = createClient({ chain: testnetBradbury });

export async function ensureBradbury() {
  if (!window.ethereum) throw new Error("Install MetaMask to enter Lorynth.");
  const chainId = "0x107d";
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error
      ? Number((error as { code: unknown }).code)
      : 0;
    if (code !== 4902 && !/unknown|unrecognized/i.test(toError(error))) throw error;
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId,
        chainName: "GenLayer Bradbury Testnet",
        nativeCurrency: { name: "GEN Token", symbol: "GEN", decimals: 18 },
        rpcUrls: ["https://rpc-bradbury.genlayer.com"],
        blockExplorerUrls: [EXPLORER],
      }],
    });
  }
}

export function writeClient(account: `0x${string}`) {
  if (!window.ethereum) throw new Error("Install MetaMask to enter Lorynth.");
  return createClient({ chain: testnetBradbury, account, provider: window.ethereum });
}

export function toError(error: unknown) {
  if (error instanceof Error) {
    if (/user rejected|denied/i.test(error.message)) return "The wallet request was cancelled.";
    return error.message.split("\n")[0];
  }
  return "The realm could not answer. Try again.";
}

export const short = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`;
