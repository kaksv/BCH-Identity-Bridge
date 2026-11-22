
import {
    decodeCashAddress,
    encodeCashAddress,
    hash160,
    secp256k1,
} from "@bitauth/libauth";

import { randomBytes } from "node:crypto";
import type { BCHNetwork } from "./schema";

export function validateBCHAddress(
    address: string,
    network: BCHNetwork
): boolean {
    if (typeof address !== "string") return false;

    const prefix =
        network === "mainnet" ? "bitcoincash" : "bchtest";

    if (!address.startsWith(`${prefix}:`)) return false;

    const decoded = decodeCashAddress(address);

    if (typeof decoded === "string") return false;

    if (
        decoded.prefix !== prefix ||
        decoded.type !== "p2pkh" ||
        decoded.payload.length !== 20
    ) {
        return false;
    }

    const encoded = encodeCashAddress({
        prefix,
        type: "p2pkh",
        payload: decoded.payload,
    });

    return encoded.address === address;
}

// For local testing only. Not a production wallet.
export function generateTestBCHKeypair(
    network: BCHNetwork = "chipnet"
) {
    let privateKey: Uint8Array;

    do {
        privateKey = randomBytes(32);
    } while (!secp256k1.validatePrivateKey(privateKey));

    const publicKey =
        secp256k1.derivePublicKeyCompressed(privateKey);

    if (typeof publicKey === "string") {
        throw new Error(publicKey);
    }

    const publicKeyHash = hash160(publicKey);

    const prefix =
        network === "mainnet" ? "bitcoincash" : "bchtest";

    const result = encodeCashAddress({
        prefix,
        type: "p2pkh",
        payload: publicKeyHash,
    });

    return {
        privateKey,
        publicKey,
        address: result.address,
        network,
    };
}
