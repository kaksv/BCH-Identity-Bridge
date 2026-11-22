import { randomBytes } from "node:crypto";

import {
    PROTOCOL,
    PROTOCOL_VERSION,
    type BCHNetwork,
    type IdentityBinding,
} from "./schema";

export interface CreateChallengeOptions {
    network: BCHNetwork;
    bchAddress: string;
    nostrPubkey: string;
    lifetimeSeconds?: number;
}

export function createBindingChallenge(
    options: CreateChallengeOptions
): IdentityBinding {
    const now = Math.floor(Date.now() / 1000);

    const lifetime = options.lifetimeSeconds ?? 86400;

    if (
        !Number.isSafeInteger(lifetime) ||
        lifetime <= 0 ||
        lifetime > 86400
    ) {
        throw new Error(
            "Lifetime must be between 1 and 86400 seconds"
        );
    }

    return {
        protocol: PROTOCOL,
        version: PROTOCOL_VERSION,
        network: options.network,
        bchAddress: options.bchAddress,
        nostrPubkey: options.nostrPubkey,
        nonce: randomBytes(32).toString("hex"),
        issuedAt: now,
        expiresAt: now + lifetime,
    };
}