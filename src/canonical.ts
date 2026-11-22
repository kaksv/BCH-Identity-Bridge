import type { IdentityBinding } from "./schema";

export function canonicalizeBinding(
    binding: IdentityBinding
): string {
    return JSON.stringify({
        protocol: binding.protocol,
        version: binding.version,
        network: binding.network,
        bchAddress: binding.bchAddress,
        nostrPubkey: binding.nostrPubkey,
        nonce: binding.nonce,
        issuedAt: binding.issuedAt,
        expiresAt: binding.expiresAt,
    });
}

export function createBindingMessage(
    binding: IdentityBinding
): string {
    return (
        "BCH Identity Bridge\n" +
        "Version: 1\n" +
        canonicalizeBinding(binding)
    );
}