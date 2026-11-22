
import { getWalletConnectClient } from "./walletconnect";

export type PaytacaSession = {
    topic: string;
    namespaces: Record<
        string,
        {
            accounts: string[];
            methods: string[];
            events: string[];
        }
    >;
};

export async function connectPaytaca(
    onUri: (uri: string) => void
): Promise<PaytacaSession> {
    const client = await getWalletConnectClient();

    const { uri, approval } = await client.connect({
        requiredNamespaces: {},
    });

    if (!uri) {
        throw new Error(
            "WalletConnect did not generate a pairing URI."
        );
    }

    onUri(uri);

    const session = await Promise.race([
        approval(),
        new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(
                    new Error(
                        "Paytaca did not approve the WalletConnect session within 60 seconds. Check the wallet connection and try again."
                    )
                );
            }, 60_000);
        }),
    ]);

    return {
        topic: session.topic,
        namespaces: session.namespaces,
    };
}
