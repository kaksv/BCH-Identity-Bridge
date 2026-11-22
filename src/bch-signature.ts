
import {
    hash160,
    encodeCashAddress,
    secp256k1,
} from "@bitauth/libauth";

import { createHash } from "node:crypto";
import type { BCHNetwork } from "./schema";

const MESSAGE_PREFIX = "\x18Bitcoin Signed Message:\n";

function encodeVarInt(value: number): Buffer {
    if (!Number.isSafeInteger(value) || value < 0) {
        throw new Error("Invalid length");
    }

    if (value < 253) {
        return Buffer.from([value]);
    }

    if (value <= 0xffff) {
        const buffer = Buffer.alloc(3);
        buffer[0] = 0xfd;
        buffer.writeUInt16LE(value, 1);
        return buffer;
    }

    if (value <= 0xffffffff) {
        const buffer = Buffer.alloc(5);
        buffer[0] = 0xfe;
        buffer.writeUInt32LE(value, 1);
        return buffer;
    }

    const buffer = Buffer.alloc(9);
    buffer[0] = 0xff;
    buffer.writeBigUInt64LE(BigInt(value), 1);
    return buffer;
}

function sha256(data: Uint8Array): Buffer {
    return createHash("sha256").update(data).digest();
}

export function hashBCHMessage(message: string): Uint8Array {
    const messageBytes = Buffer.from(message, "utf8");

    const serialized = Buffer.concat([
        Buffer.from(MESSAGE_PREFIX, "utf8"),
        encodeVarInt(messageBytes.length),
        messageBytes,
    ]);

    return sha256(sha256(serialized));
}

/**
 * Local test signer using a compressed P2PKH key.
 * Never expose private keys in logs or API responses.
 */
export function signBCHMessage(
    message: string,
    privateKey: Uint8Array
): string {
    const digest = hashBCHMessage(message);

    const result =
        secp256k1.signMessageHashRecoverableCompact(
            privateKey,
            digest
        );

    if (typeof result === "string") {
        throw new Error(result);
    }

    if (
        result.signature.length !== 64 ||
        !Number.isInteger(result.recoveryId) ||
        result.recoveryId < 0 ||
        result.recoveryId > 3
    ) {
        throw new Error("Invalid recoverable signature");
    }

    // Bitcoin compact signed-message header:
    // 27 + recovery ID + 4 for compressed public keys.
    const header = 31 + result.recoveryId;

    return Buffer.concat([
        Buffer.from([header]),
        Buffer.from(result.signature),
    ]).toString("base64");
}

export function verifyBCHMessage(
    message: string,
    signatureBase64: string,
    address: string,
    network: BCHNetwork
): boolean {
    try {
        if (
            typeof message !== "string" ||
            typeof signatureBase64 !== "string" ||
            typeof address !== "string"
        ) {
            return false;
        }

        // Require canonical base64 encoding.
        if (
            !/^[A-Za-z0-9+/]{86}==$/.test(signatureBase64)
        ) {
            return false;
        }

        const signature = Buffer.from(
            signatureBase64,
            "base64"
        );

        if (
            signature.length !== 65 ||
            signature.toString("base64") !== signatureBase64
        ) {
            return false;
        }

        const header = signature[0];

        // Compressed P2PKH signatures only.
        if (header < 31 || header > 34) {
            return false;
        }

        const recoveryId = (header - 31) as 0 | 1 | 2 | 3;

        const digest = hashBCHMessage(message);

        const publicKey =
            secp256k1.recoverPublicKeyCompressed(
                signature.subarray(1),
                recoveryId,
                digest
            );

        if (typeof publicKey === "string") {
            return false;
        }

        const prefix =
            network === "mainnet"
                ? "bitcoincash"
                : network === "chipnet"
                    ? "bchtest"
                    : null;

        if (!prefix) return false;

        const derived = encodeCashAddress({
            prefix,
            type: "p2pkh",
            payload: hash160(publicKey),
        });

        return derived.address === address;
    } catch {
        return false;
    }
}
