import { readFile } from "node:fs/promises";
import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";

const code = await readFile(new URL("../contracts/lorynth.py", import.meta.url));
const client = createClient({ chain: testnetBradbury });
const schema = await client.getContractSchemaForCode(new Uint8Array(code));
console.log(JSON.stringify(schema, null, 2));

const expected = ["choose_path", "get_chapter", "get_chapter_count", "get_world"];
for (const method of expected) {
  if (!schema.methods?.[method]) throw new Error(`Schema is missing ${method}`);
}
if ((schema.ctor?.params?.length ?? -1) !== 0) throw new Error("Constructor must have no arguments");
console.log("Lorynth schema check passed.");
