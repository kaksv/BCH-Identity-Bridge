
import {
    publicKeyToP2pkhCashAddress,
} from "@bitauth/libauth";

/**
 * Convert a compressed BCH public key into
 * a mainnet P2PKH CashAddr address.
 *
 * This does not require a private key.
 */
export function publicKeyToBchAddress(
    publicKey: Uint8Array
): string {
    if (
        publicKey.length !== 33 ||
        (publicKey[0] !== 0x02 && publicKey[0] !== 0x03)
    ) {
        throw new Error(
            "Expected a 33-byte compressed BCH public key."
        );
    }

    const result = publicKeyToP2pkhCashAddress({
        publicKey,
        prefix: "bitcoincash",
    });

    if (typeof result === "string") {
        throw new Error(result);
    }

    return result.address;
}

export function publicKeyToTokenAwareBchAddress(
    publicKey: Uint8Array
): string {
    const result = publicKeyToP2pkhCashAddress({
        publicKey,
        prefix: "bitcoincash",
        tokenSupport: true,
    });

    if (typeof result === "string") {
        throw new Error(result);
    }

    return result.address;
}
