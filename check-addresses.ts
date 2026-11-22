
import { decodeCashAddress } from "@bitauth/libauth";

const dappAddress =
    "bitcoincash:qzs57g5ddrp97ws3tmeg5mdvdvtstecvsqqen05dzp";

const paytacaAddress =
    "bitcoincash:zq9devwde8hjhwz6zyc7vnn5d3g3z9ejec924dgsye";

function decode(address: string) {
    const result = decodeCashAddress(address);

    if (typeof result === "string") {
        throw new Error(result);
    }

    return {
        type: result.type,
        payload: Buffer.from(result.payload).toString("hex"),
    };
}

const dapp = decode(dappAddress);
const paytaca = decode(paytacaAddress);

console.log("DApp:", dapp);
console.log("Paytaca:", paytaca);

console.log(
    "Same public-key hash:",
    dapp.payload === paytaca.payload
);
