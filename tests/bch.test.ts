
import { describe, expect, it } from "vitest";

import {
    generateTestBCHKeypair,
    validateBCHAddress,
} from "../src/bch";

describe("BCH Identity Bridge - BCH", () => {
    it("generates a valid chipnet address", () => {
        const wallet = generateTestBCHKeypair("chipnet");

        expect(wallet.address.startsWith("bchtest:")).toBe(true);

        expect(
            validateBCHAddress(wallet.address, "chipnet")
        ).toBe(true);
    });

    it("generates a valid mainnet address", () => {
        const wallet = generateTestBCHKeypair("mainnet");

        expect(
            validateBCHAddress(wallet.address, "mainnet")
        ).toBe(true);
    });

    it("rejects an address on the wrong network", () => {
        const wallet = generateTestBCHKeypair("chipnet");

        expect(
            validateBCHAddress(wallet.address, "mainnet")
        ).toBe(false);
    });

    it("rejects malformed addresses", () => {
        expect(
            validateBCHAddress("bchtest:invalid", "chipnet")
        ).toBe(false);
    });

    it("generates different keys and addresses", () => {
        const first = generateTestBCHKeypair();
        const second = generateTestBCHKeypair();

        expect(first.address).not.toBe(second.address);
        expect(first.publicKey).not.toEqual(second.publicKey);
    });
});
