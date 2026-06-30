# Lorynth

Lorynth is an on-chain collaborative fantasy game. Each player chooses one of three paths; GenLayer validators turn that choice into the next canonical chapter and three new paths.

- Live app: [lorynth-genlayer.vercel.app](https://lorynth-genlayer.vercel.app)


Unlike an oracle or verification app, Lorynth uses AI consensus for shared creative authorship. The contract stores the current scene, choices, chapter count, last player, and the full chapter history.

## GenLayer architecture

- Network: Bradbury Testnet
- Chain ID: `4221`
- RPC: `https://rpc-bradbury.genlayer.com`
- Explorer: `https://explorer-bradbury.genlayer.com`
- Contract: [`0xE5ECbe431c75709f3883aE11930E8b188FcBc59B`](https://explorer-bradbury.genlayer.com/address/0xE5ECbe431c75709f3883aE11930E8b188FcBc59B)
- Deployment transaction: [`0x38c7f0ae7a65e80a9a90ffaf98519fab7272aa2ce0cc865415509cdbec95c69b`](https://explorer-bradbury.genlayer.com/tx/0x38c7f0ae7a65e80a9a90ffaf98519fab7272aa2ce0cc865415509cdbec95c69b)
- Deployment status: `FINALIZED · AGREE · FINISHED_WITH_RETURN`
- Firs transaction: [`0x4ca0163d41718b36602bbc729e8630d387326ed1ab7dd58a0f85a673caa197dd`](https://explorer-bradbury.genlayer.com/tx/0x4ca0163d41718b36602bbc729e8630d387326ed1ab7dd58a0f85a673caa197dd)
- Game transaction status: `FINALIZED · AGREE · FINISHED_WITH_RETURN` (`result_code = 0`, empty stderr)
- Canon result: chapter 2 stored on-chain after the player opened the whispering lantern
- Contract class: `Lorynth`
- Constructor: no arguments
- Write method: `choose_path(choice: int)`
- Views: `get_world()`, `get_chapter(chapter)`, `get_chapter_count()`

The leader generates a bounded JSON continuation. Validators independently review its continuity, safety, and choice diversity. Only a consensus-approved chapter is written to storage through `gl.vm.run_nondet_unsafe`.


