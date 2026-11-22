import { describe, expect, it } from "vitest";

import { createBindingChallenge } from "../src/challenge";
import {
    canonicalizeBinding,
    createBindingMessage,
} from "../src/canonical";

const sample = {
    network: "chipnet" as const,
    bchAddress: "bchtest:example",
    nostrPubkey: "a".repeat(64),
};

describe("BCH Identity Bridge - Binding", () => {
    it("creates a challenge with the correct protocol", () => {
        const binding = createBindingChallenge(sample);

        expect(binding.protocol).toBe("bch-identity-bridge");
        expect(binding.version).toBe(1);
        expect(binding.network).toBe("chipnet");
    });

    it("generates a unique 32-byte nonce", () => {
        const first = createBindingChallenge(sample);
        const second = createBindingChallenge(sample);

        expect(first.nonce).toMatch(/^[0-9a-f]{64}$/);
        expect(first.nonce).not.toBe(second.nonce);
    });

    it("produces deterministic canonical serialization", () => {
        const binding = createBindingChallenge(sample);

        const first = canonicalizeBinding(binding);
        const second = canonicalizeBinding(binding);

        expect(first).toBe(second);
    });

    it("includes domain separation in the signing message", () => {
        const binding = createBindingChallenge(sample);

        const message = createBindingMessage(binding);

        expect(message).toContain("BCH Identity Bridge");
        expect(message).toContain(binding.nonce);
    });

    it("rejects invalid challenge lifetimes", () => {
        expect(() =>
            createBindingChallenge({
                ...sample,
                lifetimeSeconds: 0,
            })
        ).toThrow();

        expect(() =>
            createBindingChallenge({
                ...sample,
                lifetimeSeconds: 100000,
            })
        ).toThrow();
    });
});