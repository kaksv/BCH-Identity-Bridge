
import {
    finalizeEvent,
    verifyEvent,
    type Event as NostrEvent,
} from "nostr-tools";

export type BindingChallenge = {
    version: 1;
    domain: "bch-identity-bridge";
    bchAddress: string;
    nostrPubkey: string;
    nonce: string;
    issuedAt: number;
    expiresAt: number;
};

export type SignedBinding = {
    challenge: BindingChallenge;
    nostrEvent: NostrEvent;
    bchSignature: null;
    status: "pending-bch-signature";
};

export function createBindingChallenge(
    bchAddress: string,
    nostrPubkey: string
): BindingChallenge {
    if (!bchAddress.startsWith("bitcoincash:")) {
        throw new Error("Invalid Bitcoin Cash address.");
    }

    if (!/^[0-9a-f]{64}$/.test(nostrPubkey)) {
        throw new Error("Invalid Nostr public key.");
    }

    const now = Math.floor(Date.now() / 1000);

    return {
        version: 1,
        domain: "bch-identity-bridge",
        bchAddress,
        nostrPubkey,
        nonce: crypto.randomUUID(),
        issuedAt: now,
        expiresAt: now + 600,
    };
}

export function challengeToMessage(
    challenge: BindingChallenge
): string {
    return JSON.stringify(challenge);
}

export function verifyNostrBinding(
    binding: SignedBinding
): boolean {
    const { challenge, nostrEvent } = binding;

    if (challenge.expiresAt < Math.floor(Date.now() / 1000)) {
        return false;
    }

    if (nostrEvent.pubkey !== challenge.nostrPubkey) {
        return false;
    }

    if (nostrEvent.kind !== 1) {
        return false;
    }

    if (nostrEvent.content !== challengeToMessage(challenge)) {
        return false;
    }

    return verifyEvent(nostrEvent);
}
