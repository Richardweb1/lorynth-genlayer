import { useCallback, useEffect, useRef, useState } from "react";
import type { Hash } from "genlayer-js/types";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  Compass,
  ExternalLink,
  LoaderCircle,
  MoonStar,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  CONTRACT_ADDRESS,
  EXPLORER,
  ensureBradbury,
  readClient,
  short,
  toError,
  writeClient,
} from "./genlayer";

type World = { chapter: number; scene: string; choices: [string, string, string] };
type Phase = "IDLE" | "SIGNING" | "PENDING" | "PROPOSING" | "COMMITTING" | "REVEALING" | "ACCEPTED" | "FINALIZED";

const opening: World = {
  chapter: 1,
  scene: "At the edge of the sleeping kingdom, three moonlit roads meet beneath a tree made of silver glass. A sealed lantern whispers your name.",
  choices: ["Open the whispering lantern", "Follow the road of blue flowers", "Climb the silver-glass tree"],
};

const phaseCopy: Record<Phase, string> = {
  IDLE: "The realm is listening",
  SIGNING: "Confirm your choice",
  PENDING: "Your choice enters the realm",
  PROPOSING: "A new chapter is taking shape",
  COMMITTING: "The chroniclers are committing",
  REVEALING: "The next path is being revealed",
  ACCEPTED: "The chapter is now canon",
  FINALIZED: "Written forever in Lorynth",
};

function parseWorld(raw: unknown): World {
  if (typeof raw !== "string") throw new Error("The contract returned an unreadable world.");
  const [chapter, scene, one, two, three] = raw.split("|");
  if (!scene || !one || !two || !three) throw new Error("The world state is incomplete.");
  return { chapter: Number(chapter), scene, choices: [one, two, three] };
}

export default function App() {
  const [world, setWorld] = useState(opening);
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [phase, setPhase] = useState<Phase>("IDLE");
  const [consensus, setConsensus] = useState("IDLE");
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(CONTRACT_ADDRESS));
  const alive = useRef(true);
  const busy = !["IDLE", "FINALIZED"].includes(phase);

  const refreshWorld = useCallback(async () => {
    if (!CONTRACT_ADDRESS) return;
    setLoading(true);
    try {
      const raw = await readClient.readContract({ address: CONTRACT_ADDRESS, functionName: "get_world", args: [] });
      setWorld(parseWorld(raw));
      setError("");
    } catch (err) {
      setError(toError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    void refreshWorld();
    void window.ethereum?.request({ method: "eth_accounts" }).then((accounts) => {
      const first = Array.isArray(accounts) ? accounts[0] : null;
      if (typeof first === "string") setAccount(first as `0x${string}`);
    });
    return () => { alive.current = false; };
  }, [refreshWorld]);

  const connect = async () => {
    setError("");
    try {
      if (!window.ethereum) throw new Error("Install MetaMask to enter Lorynth.");
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const first = Array.isArray(accounts) ? accounts[0] : null;
      if (typeof first !== "string") throw new Error("No wallet account was returned.");
      await ensureBradbury();
      const address = first as `0x${string}`;
      setAccount(address);
      return address;
    } catch (err) {
      setError(toError(err));
      return null;
    }
  };

  const poll = async (hash: `0x${string}`) => {
    for (let attempt = 0; attempt < 240 && alive.current; attempt += 1) {
      const transaction = await readClient.getTransaction({ hash: hash as Hash });
      const next = String(transaction.statusName || "PENDING") as Phase;
      setPhase(next in phaseCopy ? next : "PENDING");
      setConsensus(String(transaction.resultName || "IDLE"));
      if (next === "ACCEPTED" || next === "FINALIZED") {
        await refreshWorld();
        if (next === "FINALIZED") return;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 5000));
    }
  };

  const choose = async (choice: number) => {
    setError("");
    if (!CONTRACT_ADDRESS) {
      setError("The local preview is ready. Deploy the Lorynth contract to unlock choices.");
      return;
    }
    setPhase("SIGNING");
    try {
      const address = account || await connect();
      if (!address) { setPhase("IDLE"); return; }
      await ensureBradbury();
      const hash = await writeClient(address).writeContract({
        address: CONTRACT_ADDRESS,
        functionName: "choose_path",
        args: [choice],
        value: 0n,
      });
      setTxHash(hash);
      setPhase("PENDING");
      await poll(hash);
    } catch (err) {
      setError(toError(err));
      setPhase("IDLE");
    }
  };

  return (
    <div className="realm-shell">
      <a className="skip-link" href="#story">Skip to the story</a>
      <div className="stars" aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Lorynth home"><MoonStar size={25} />Lorynth</a>
        <div className="header-meta">
          <span className="network"><i />Bradbury Testnet</span>
          <button className="wallet-btn" onClick={() => void connect()} type="button">
            <Wallet size={17} />{account ? short(account) : "Enter with wallet"}
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><Sparkles size={16} />A world written by its wanderers</p>
            <h1>Every choice<br />becomes <em>legend.</em></h1>
            <p>Lorynth is a living fantasy world. Players choose the path; independent GenLayer minds make the next chapter canon.</p>
            <a href="#story" className="enter-link">Enter chapter {world.chapter}<ChevronRight size={19} /></a>
          </div>
          <div className="orbital-map" aria-label="A decorative map of the Lorynth realm">
            <div className="orbit orbit-one"><span /></div>
            <div className="orbit orbit-two"><span /></div>
            <div className="realm-mark"><Compass size={33} /><b>THE<br />WILD<br />VEIL</b></div>
            <span className="map-label north">Glasswood</span>
            <span className="map-label east">Ember Reach</span>
            <span className="map-label south">The Hollow Sea</span>
          </div>
        </section>

        <section className="story-grid" id="story">
          <aside className="chronicle">
            <div className="section-label"><ScrollText size={17} />The chronicle</div>
            <div className="timeline">
              <div className="timeline-item active"><span>Chapter {world.chapter}</span><strong>Where the paths meet</strong><small>Current chapter</small></div>
              {world.chapter > 1 ? <div className="timeline-item"><span>Chapter {world.chapter - 1}</span><strong>The path before</strong><small>Written on-chain</small></div> : null}
              <div className="timeline-item locked"><span>Chapter {world.chapter + 1}</span><strong>Unwritten</strong><small>Waiting for a wanderer</small></div>
            </div>
            <div className="canon-note"><ShieldCheck size={19} /><p><strong>Consensus canon</strong>Every chapter is approved by independent GenLayer validators.</p></div>
          </aside>

          <article className="story-card">
            <div className="chapter-head"><span><BookOpen size={17} />Chapter {world.chapter}</span><button type="button" onClick={() => void refreshWorld()} disabled={loading} aria-label="Refresh story"><RefreshCw className={loading ? "spin" : ""} size={18} /></button></div>
            <div className="scene-mark" aria-hidden="true">{String(world.chapter).padStart(2, "0")}</div>
            <p className="scene">{world.scene}</p>
            <div className="divider"><span>Choose what happens next</span></div>
            <div className="choices">
              {world.choices.map((choice, index) => (
                <button type="button" className="choice" disabled={busy || loading} onClick={() => void choose(index + 1)} key={choice}>
                  <span>{String(index + 1).padStart(2, "0")}</span><strong>{choice}</strong><ArrowUpRight size={19} />
                </button>
              ))}
            </div>
            {error ? <div className="error" role="alert"><CircleAlert size={18} />{error}</div> : null}
          </article>
        </section>

        {txHash ? <section className="progress" aria-live="polite"><div className="progress-icon">{phase === "FINALIZED" ? <Check /> : <LoaderCircle className="spin" />}</div><div><span>{phase}</span><h2>{phaseCopy[phase]}</h2><p>Consensus: {consensus}</p></div><a href={`${EXPLORER}/tx/${txHash}`} target="_blank" rel="noreferrer">{txHash}<ExternalLink size={15} /></a></section> : null}
      </main>

      <footer><span>Lorynth · a consensual story world</span>{CONTRACT_ADDRESS ? <a href={`${EXPLORER}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer">Contract {short(CONTRACT_ADDRESS)}<ExternalLink size={14} /></a> : <span>Awaiting Bradbury deployment</span>}</footer>
    </div>
  );
}
