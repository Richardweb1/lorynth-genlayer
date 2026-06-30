import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";

const hash = process.argv[2];
if (!/^0x[0-9a-fA-F]{64}$/.test(hash || "")) throw new Error("Pass a valid transaction hash");

const address = "0xE5ECbe431c75709f3883aE11930E8b188FcBc59B";
const client = createClient({ chain: testnetBradbury });
const stringify = (value) => JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item, 2);

const tx = await client.getTransaction({ hash });
console.log("TRANSACTION");
console.log(stringify({
  txId: tx.txId,
  recipient: tx.recipient,
  sender: tx.sender,
  statusName: tx.statusName,
  resultName: tx.resultName,
  txExecutionResultName: tx.txExecutionResultName,
  txDataDecoded: tx.txDataDecoded,
}));

try {
  const trace = await client.debugTraceTransaction({ hash });
  console.log("TRACE");
  console.log(stringify({ result_code: trace.result_code, stderr: trace.stderr }));
} catch (error) {
  console.log("TRACE_UNAVAILABLE", error instanceof Error ? error.message.split("\n")[0] : String(error));
}

const [world, count] = await Promise.all([
  client.readContract({ address, functionName: "get_world", args: [] }),
  client.readContract({ address, functionName: "get_chapter_count", args: [] }),
]);
console.log("WORLD", stringify({ world, count }));
