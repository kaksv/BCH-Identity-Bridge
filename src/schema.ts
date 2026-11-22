export const PROTOCOL = "bch-identity-bridge" as const;
export const PROTOCOL_VERSION = 1 as const;

export type BCHNetwork = "mainnet" | "chipnet";

export interface IdentityBinding {
    protocol: typeof PROTOCOL;
    version: typeof PROTOCOL_VERSION;
    network: BCHNetwork;
    bchAddress: string;
    nostrPubkey: string;
    nonce: string;
    issuedAt: number;
    expiresAt: number;
}

export interface IdentityProof {
    payload: IdentityBinding;
    bchSignature: string;
    nostrEvent: {
        id: string;
        pubkey: string;
        created_at: number;
        kind: number;
        tags: string[][];
        content: string;
        sig: string;
    };
}