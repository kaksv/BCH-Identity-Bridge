
"use client";

import { useState, useEffect } from "react";
import { publicKeyToTokenAwareBchAddress } from "../lib/bch-address";
import type { Event as NostrEvent } from "nostr-tools";
import {
  useWizardConnect,
  WizardConnectQRDialog,
} from "@wizardconnect/react";
import {
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Copy,
  Fingerprint,
  Code2,
  Link2,
  LockKeyhole,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";
import {
  createBindingChallenge,
  challengeToMessage,
  verifyNostrBinding,
  type SignedBinding,
} from "../lib/binding";


type Identity = "bch" | "nostr";

type NostrProvider = {
  getPublicKey: () => Promise<string>;
  signEvent: (
    event: Omit<NostrEvent, "id" | "sig" | "pubkey">
  ) => Promise<NostrEvent>;
};

declare global {
  interface Window {
    nostr?: NostrProvider;
  }
}

export default function Home() {
  const [bch, setBch] = useState("");
  const [nostr, setNostr] = useState("");
  const [activeTab, setActiveTab] = useState<"identity" | "verify">(
    "identity"
  );
  const [proof, setProof] = useState("");
  const [notice, setNotice] = useState("");
  const wizard = useWizardConnect({
    dappName: "BCH Identity Bridge",
  });
  const bchConnected = wizard.state === "connected";
  const connected = bchConnected && Boolean(bch && nostr);
  const [signedBinding, setSignedBinding] = useState<SignedBinding | null>(null);



 useEffect(() => {
  if (wizard.state !== "connected" || !wizard.manager) {
    return;
  }

  try {
    // Receive branch 0, address index 1.
    const publicKey = wizard.manager.getPubkey(
      0,
      BigInt(1)
    );

    if (!publicKey) {
      throw new Error("Wallet public key is unavailable.");
    }

    const address =
      publicKeyToTokenAwareBchAddress(publicKey);

    // Schedule the state update outside the synchronous effect body.
    queueMicrotask(() => {
      setBch(address);
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to derive BCH address.";

    queueMicrotask(() => {
      setBch("");
      setNotice(`BCH address derivation failed: ${message}`);
    });
  }
 }, [wizard.state, wizard.manager]);


 async function connectIdentity(type: Identity) {
  setNotice("");

  if (type === "bch") {
  setNotice("Opening WizardConnect. Connect using Paytaca.");
  wizard.connect();
  return;
 }

  try {
    if (!window.nostr) {
      setNotice(
        "No Nostr browser extension detected. Install or enable a NIP-07 compatible extension, then refresh the page."
      );
      return;
    }

    const publicKey = await window.nostr.getPublicKey();

    if (!/^[0-9a-f]{64}$/.test(publicKey)) {
      throw new Error("The Nostr provider returned an invalid public key.");
    }

    setNostr(publicKey);
    setNotice("Nostr identity connected successfully.");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    setNotice(`Nostr connection failed: ${message}`);
  }
 }

  async function copyText(value: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setNotice("Copied to clipboard.");
    } catch {
      setNotice("Clipboard access is unavailable.");
    }
  }

 function downloadBindingProof() {
  if (!signedBinding) {
    setNotice("Create a signed binding first.");
    return;
  }

  const blob = new Blob(
    [JSON.stringify(signedBinding, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `bch-identity-proof-${signedBinding.challenge.nonce}.json`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
 }

 async function createIdentityBinding() {
  try {
    setNotice("");

    if (!bch || !nostr || !window.nostr) {
      throw new Error("Connect both identities first.");
    }

    const challenge = createBindingChallenge(bch, nostr);

    const unsignedEvent = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ["t", "bch-identity-bridge"],
        ["bch", bch],
      ],
      content: challengeToMessage(challenge),
    };

    const nostrEvent = await window.nostr.signEvent(
      unsignedEvent
    );

    const binding: SignedBinding = {
      challenge,
      nostrEvent,
      bchSignature: null,
      status: "pending-bch-signature",
    };

    if (!verifyNostrBinding(binding)) {
      throw new Error("Nostr signature verification failed.");
    }

    setSignedBinding(binding);
    setProof(JSON.stringify(binding, null, 2));

    setNotice(
      "Nostr signature verified. BCH ownership signature is still required."
    );
  } catch (error) {
    setNotice(
      error instanceof Error
        ? error.message
        : "Unable to create identity binding."
    );
  }
 }

 function verifyImportedProof() {
  try {
    const parsed: unknown = JSON.parse(proof);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("challenge" in parsed) ||
      !("nostrEvent" in parsed)
    ) {
      throw new Error("Invalid proof format.");
    }

    const valid = verifyNostrBinding(
      parsed as SignedBinding
    );

    setNotice(
      valid
        ? "Nostr attestation verified successfully. The signed claim has not been modified. BCH address ownership remains unverified."
        : "Verification failed. The Nostr signature is invalid, the proof has expired, or the signed claim has been modified."
    );
  } catch (error) {
    setNotice(
      error instanceof Error
        ? error.message
        : "Invalid proof."
    );
  }
 }


  return (
    <main className="min-h-screen bg-[#080c16] text-white">
      <header className="border-b border-white/10">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-400 p-2 text-black">
              <Fingerprint size={23} />
            </div>
            <span className="text-lg font-bold tracking-tight">
              BCH Identity <span className="text-emerald-400">Bridge</span>
            </span>
          </div>

          <div className="flex items-center gap-5">
            <a
              href="https://github.com/kaksv/BCH-Identity-Bridge"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="text-slate-400 hover:text-white"
            >
              <Code2 size={20} />
            </a>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                        <a
              href="https://github.com/kaksv/BCH-Identity-Bridge"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="text-slate-400 hover:text-white"
            >
            https://youtu.be/Th0BiSy5WD0  
            </a>
            
              MVP Preview
            </span>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-12 pt-16">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-300">
          <Zap size={14} />
          Self-sovereign identity for Bitcoin Cash + Nostr
        </div>

        <h2 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          One identity.
          {/* <br /> */}
          Two networks.
          {/* <br /> */}
          <span className="text-emerald-400">Verifiable trust.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
          Connect your Bitcoin Cash wallet through Paytaca and your Nostr identity through a compatible browser extension. Generate a unique binding challenge and sign it using your Nostr identity.

          Your signed claim can be exported and independently verified. BCH ownership verification is planned for a future release.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() => {
              setActiveTab("identity");
              document.getElementById("workspace")?.scrollIntoView({
                behavior: "smooth",
              });
            }}
            className="flex items-center gap-2 rounded-xl bg-emerald-400 px-6 py-3 font-semibold text-black hover:bg-emerald-300"
          >
            Create Identity <ArrowRight size={18} />
          </button>
          <button
            type="button"
            disabled={!signedBinding}
            onClick={downloadBindingProof}
            className="rounded-xl border border-white/20 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Download Binding Proof
          </button>

          <button
            onClick={verifyImportedProof}
            className="rounded-xl border border-white/15 px-6 py-3 font-medium hover:bg-white/5"
          >
            Verify a Proof
          </button>

        </div>
      </section>

      <section
        id="workspace"
        className="mx-auto max-w-6xl px-5 pb-20"
      >
        <div className="mb-6 flex gap-2 border-b border-white/10">
          {(["identity", "verify"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setNotice("");
              }}
              className={`border-b-2 px-5 py-4 text-sm font-medium capitalize ${
                activeTab === tab
                  ? "border-emerald-400 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {tab === "identity" ? "My Identity" : "Verify Identity"}
            </button>
          ))}
        </div>

        {notice && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200"
          >
            {notice}
          </div>
        )}


{wizard.uri && wizard.qrUri && (
  <WizardConnectQRDialog
    show={wizard.state === "connecting"}
    onClose={() => {
      void wizard.disconnect();
    }}
    uri={wizard.uri}
    qrUri={wizard.qrUri}
    title="Connect Paytaca"
    subtitle="Scan with Paytaca's WizardConnect scanner"
  />
)}

{wizard.state === "connected" && (
  <div className="mb-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4">
    <p className="font-semibold text-emerald-300">
      Paytaca connected through WizardConnect
    </p>

    <p className="mt-2 text-sm text-slate-300">
      Wallet: {wizard.walletName ?? "Connected wallet"}
    </p>
  </div>
)}

{wizard.error && (
  <p className="mb-6 text-sm text-red-400">
    WizardConnect error: {wizard.error}
  </p>
)}

        {activeTab === "identity" ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <div className="grid gap-5 sm:grid-cols-2">
                <IdentityCard
                  title="Bitcoin Cash"
                  description="Connect your BCH wallet to prove address ownership."
                  icon={<Wallet size={25} />}
                  value={bch}
                  isConnected={bchConnected}
                  onConnect={() => {
                    if (bchConnected) {
                      setBch("");
                      void wizard.disconnect();
                    } else {
                      void connectIdentity("bch");
                    }
                  }}
                  onCopy={() => copyText(bch)}
                />

                <IdentityCard
                  title="Nostr"
                  description="Connect your Nostr public key using a compatible signer."
                  icon={<Zap size={25} />}
                  value={nostr}
                  onConnect={() => connectIdentity("nostr")}
                  onCopy={() => copyText(nostr)}
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
                <div className="mb-5 flex items-center gap-3">
                  <Link2 className="text-emerald-400" />
                  <h2 className="text-xl font-semibold">
                    Identity Binding
                  </h2>
                </div>

                <p className="mb-6 text-sm leading-relaxed text-slate-400">
                  Link your two identities using independently signed
                  cryptographic proofs. Both identities must be
                  connected before binding can begin.
                </p>

                <div className="mb-6 space-y-4">
                  <StatusRow
                    label="BCH address available"
                    complete={bchConnected && Boolean(bch)}
                  />
                  <StatusRow
                    label="BCH address retrieved"
                    complete={Boolean(bch)}
                  />
                  <StatusRow
                    label="Nostr identity connected"
                    complete={Boolean(nostr)}
                  />
                  <StatusRow
                    label="Nostr signature verified"
                    complete={Boolean(signedBinding)}
                  />
                  <StatusRow
                    label="Dual-signature proof generated"
                    complete={Boolean(signedBinding)}
                  />
                  <StatusRow
                    label="Proof published to Nostr"
                    complete={false}
                  />
                  <StatusRow
                    label="BCH ownership verified (coming soon)"
                    complete={false}
                  />
                  <StatusRow
                    label="Dual-signature proof complete (coming soon)"
                    complete={false}
                  />
                </div>


                <button
                  disabled={!connected}
                  onClick={() => void createIdentityBinding()
                  }
                  className="w-full rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
                >
                  Create Identity Binding
                </button>
              </div>
            </div>

            <aside className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
                <h2 className="mb-5 font-semibold">Identity Status</h2>

                <div className="mb-5 flex justify-center">
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 p-6">
                    <Fingerprint
                      size={44}
                      className="text-emerald-400"
                    />
                  </div>
                </div>

                <p className="text-center text-lg font-semibold">
                  Not Verified
                </p>
                <p className="mt-2 text-center text-sm text-slate-400">
                  Complete the wallet connection and binding process
                  to establish your identity.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
                <h2 className="mb-4 font-semibold">Why it matters</h2>
                <div className="space-y-5">
                  <Feature
                    icon={<LockKeyhole size={19} />}
                    title="Self-sovereign"
                    text="Your identity keys remain under your control."
                  />
                  <Feature
                    icon={<ShieldCheck size={19} />}
                    title="Cryptographically verifiable"
                    text="Independent applications can verify signed proofs."
                  />
                  <Feature
                    icon={<Link2 size={19} />}
                    title="Interoperable"
                    text="Designed to bridge Bitcoin Cash and Nostr."
                  />
                </div>
              </div>
            </aside>
          </div>
          
        ) : (
          <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#111827] p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck className="text-emerald-400" size={27} />
              <h2 className="text-xl font-semibold">
                Independent Proof Verification
              </h2>
            </div>

            <p className="mb-6 text-sm leading-relaxed text-slate-400">
              Verify a previously generated BCH–Nostr identity claim. Paste the exported JSON proof to validate its Nostr signature, confirm the signed challenge has not been altered, and check its expiration.

              This verifies the Nostr attestation only. Independent BCH ownership verification is not yet supported.
            </p>

            <label
              htmlFor="proof"
              className="mb-2 block text-sm font-medium"
            >
              Identity proof (JSON)
            </label>

            <textarea
              id="proof"
              value={proof}
              onChange={(event) => setProof(event.target.value)}
              placeholder='{"payload": {}, "bchSignature": "", "nostrEvent": {}}'
              rows={9}
              className="w-full resize-y rounded-xl border border-white/10 bg-[#080c16] p-4 font-mono text-sm text-slate-200 outline-none focus:border-emerald-400"
            />

            <button
              disabled={!proof.trim()}
              onClick={() =>
                setNotice(
                  "Verification is not connected yet. No proof has been verified."
                )
              }
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
            >
              <ShieldCheck size={18} />
              Verify Identity Proof
            </button>
          </div>
        )}
        
      </section>

      <footer className="border-t border-white/10 px-5 py-7 text-center text-sm text-slate-500">
        BCH Identity Bridge — Built for BCH BLAZE 2026
      </footer>
    </main>
  );
}

function IdentityCard({
  title,
  description,
  icon,
  value,
  isConnected,
  onConnect,
  onCopy,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  value: string;
  isConnected?: boolean;
  onConnect: () => void;
  onCopy: () => void;
}) {
  const walletConnected = isConnected ?? Boolean(value);
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-400">
          {icon}
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
          {walletConnected ? "Connected" : "Not connected"}
        </span>
      </div>

      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 min-h-12 text-sm leading-relaxed text-slate-400">
        {description}
      </p>

      {value && (
        <button
          onClick={onCopy}
          className="mt-3 flex w-full items-center justify-between rounded-lg bg-white/5 p-3 font-mono text-xs"
        >
          {value.slice(0, 18)}...
          <Copy size={14} />
        </button>
      )}

      <button
        onClick={onConnect}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-medium hover:bg-white/5"
      >
        {walletConnected ? `Disconnect ${title}` : `Connect ${title}`}
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

function StatusRow({
  label,
  complete,
}: {
  label: string;
  complete: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-300">{label}</span>
      {complete ? (
        <CheckCircle2 size={19} className="text-emerald-400" />
      ) : (
        <CircleHelp size={19} className="text-slate-600" />
      )}
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 text-emerald-400">{icon}</div>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          {text}
        </p>
      </div>
    </div>
  );
}
