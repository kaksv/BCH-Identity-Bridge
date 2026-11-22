
import type { BindingChallenge } from "./binding";

export type BchSigningPreparation = {
  challenge: BindingChallenge;
  message: string;
  broadcast: false;
  status: "awaiting-transaction-construction";
};

export function prepareBchBinding(
  challenge: BindingChallenge
): BchSigningPreparation {
  const now = Math.floor(Date.now() / 1000);

  if (challenge.expiresAt <= now) {
    throw new Error("Binding challenge has expired.");
  }

  if (!challenge.bchAddress.startsWith("bitcoincash:")) {
    throw new Error("Invalid BCH address.");
  }

  return {
    challenge,
    message: JSON.stringify({
      domain: "bch-identity-bridge",
      version: 1,
      challenge,
    }),
    broadcast: false,
    status: "awaiting-transaction-construction",
  };
}
