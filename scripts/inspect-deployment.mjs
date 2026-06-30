import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";

const address = "0xE5ECbe431c75709f3883aE11930E8b188FcBc59B";
const hash = "0x38c7f0ae7a65e80a9a90ffaf98519fab7272aa2ce0cc865415509cdbec95c69b";
const client = createClient({ chain: testnetBradbury });
const stringify = (value) => JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item, 2);

const [transaction, schema, code, world, count] = await Promise.all([
  client.getTransaction({ hash }),
  client.getContractSchema(address),
  client.getContractCode(address),
  client.readContract({ address, functionName: "get_world", args: [] }),
  client.readContract({ address, functionName: "get_chapter_count", args: [] }),
]);

console.log(stringify({
  address,
  hash,
  recipient: transaction.recipient,
  statusName: transaction.statusName,
  resultName: transaction.resultName,
  txExecutionResultName: transaction.txExecutionResultName,
  deployedAddress: transaction.txDataDecoded?.contractAddress,
  schema,
  codeMatchesLorynth: code.includes("class Lorynth"),
  world,
  count,
}));
