
import type SignClient from "@walletconnect/sign-client";

let clientPromise: Promise<SignClient> | null = null;

export async function getWalletConnectClient(): Promise<SignClient> {
    if (typeof window === "undefined") {
        throw new Error("WalletConnect must run in the browser.");
    }

    const projectId =
        process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

    if (!projectId) {
        throw new Error("WalletConnect project ID is missing.");
    }

    if (!clientPromise) {
        clientPromise = import("@walletconnect/sign-client")
            .then(({ default: SignClient }) =>
                SignClient.init({
                    projectId,
                    metadata: {
                        name: "BCH Identity Bridge",
                        description:
                            "Cryptographic identity binding between Bitcoin Cash and Nostr",
                        url: window.location.origin,
                        icons: [],
                    },
                })
            )
            .catch((error) => {
                clientPromise = null;
                throw error;
            });
    }

    return clientPromise;
}
