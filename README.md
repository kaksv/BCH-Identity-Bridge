# BCH Identity Bridge

**One identity. Two networks. Verifiable trust.**

BCH Identity Bridge is an open-source prototype for creating portable, **Nostr-signed identity claims** that associate a Bitcoin Cash (BCH) address with a Nostr public key. Users connect a BCH wallet and a NIP-07-compatible Nostr extension, sign a short-lived binding challenge, export the resulting JSON proof, and verify its Nostr signature independently.

> **Security status:** The current MVP verifies the **Nostr signature**, not ownership of the BCH address. A connected wallet or a BCH address derived from a wallet public key must **not** be treated as a verified BCH ownership signature. Complete dual-signature verification is planned, not implemented.

## Links

- **Live demo:** https://web-zuy2.vercel.app/
- **Source:** https://github.com/kaksv/BCH-Identity-Bridge

## Features

- Connect a Paytaca BCH wallet using WizardConnect.
- Retrieve a BCH public key and derive a BCH address with `@bitauth/libauth`.
- Connect a Nostr identity through a NIP-07 browser extension.
- Generate a structured challenge containing both identifiers, a unique nonce, and timestamps.
- Sign the challenge as a Nostr event.
- Verify the signed Nostr event and detect changes to the signed challenge.
- Export a portable JSON proof and import it for verification.
- Clearly distinguish **Nostr attestation verified** from **BCH ownership unverified**.

## How it works

1. **Connect BCH:** The user connects a Paytaca wallet through WizardConnect. The app obtains a public key and derives an associated BCH address.
2. **Connect Nostr:** The user authorizes a NIP-07-compatible extension and retrieves their Nostr public key.
3. **Create a challenge:** The app builds a claim containing the BCH address, Nostr public key, domain/version, random nonce, issue time, and expiry.
4. **Sign with Nostr:** The extension signs an event committing to that challenge; the private key stays with the extension.
5. **Export proof:** The challenge and signed event are packaged as JSON.
6. **Verify:** The verifier checks the Nostr event signature and its correspondence to the claim. A successful result means **only** that the Nostr key signed the stated BCH address claim, not that the BCH address is controlled by the signer.

### Verification model

| Check | MVP status |
| --- | --- |
| BCH wallet connection | Implemented |
| BCH address retrieval/derivation | Implemented |
| Nostr identity connection | Implemented |
| Nostr event signature verification | Implemented |
| Portable proof export/import | Implemented |
| Independent BCH ownership signature | **Not implemented** |
| Dual-signature ownership proof | **Not implemented** |

**Threat-model note:** A Nostr key holder can claim any BCH address in a Nostr-signed message. Until a separate BCH ownership proof is added, do not use these claims for authorization, account recovery, payments, or other security-sensitive decisions. Challenges are short-lived; expired proofs should be rejected when verifying a *current* claim. The MVP is a demonstration, not an audited identity protocol.

## Tech stack

| Layer | Technology |
| --- | --- |
| Web application | Next.js, React, TypeScript, Tailwind CSS |
| BCH wallet connection | Paytaca, WizardConnect (`@wizardconnect/react`, `@wizardconnect/dapp`) |
| BCH primitives | `@bitauth/libauth` |
| Nostr | NIP-07 browser extension, `nostr-tools` |
| Hosting | Vercel |

## Getting started

### Prerequisites

- Node.js and npm (use a version compatible with the project's Next.js release).
- A Paytaca wallet for the BCH connection flow.
- A NIP-07-compatible Nostr browser extension for signing.

### Install and run

The web application lives in `apps/web`.

```bash
# Clone the repository
git clone https://github.com/kaksv/BCH-Identity-Bridge.git
cd BCH-Identity-Bridge

# Install the web app dependencies
cd apps/web
npm install

# Start the development server
npm run dev
```

Open **http://localhost:3000**. Depending on wallet/extension restrictions, test wallet connectivity in a supported browser and secure origin; the hosted demo uses HTTPS.

### Build checks

From `apps/web`:

```bash
npx tsc --noEmit
npm run build
```

> This README does not assume any environment variables are required. If your checkout includes an `.env.example`, follow it for that version of the app.

## Demo walkthrough

1. Open the [live demo](https://web-zuy2.vercel.app/).
2. Connect Paytaca and confirm the displayed BCH address.
3. Connect a Nostr extension.
4. Create an identity binding challenge and approve the Nostr signing request.
5. Export the proof JSON.
6. Import the proof into the verification interface.
7. Confirm the expected outcome: **“Nostr signature verified. BCH ownership remains unverified.”**
8. As a tampering test, change the BCH address in the exported JSON and verify again; the modified claim should fail validation.

**Privacy:** Review a proof before sharing it. It includes public identifiers and timestamps that may link your BCH and Nostr activities. Do not publish signed events to a relay unless you intend to make that link public.

## Project structure

Selected web app files (paths are relative to the repository root):

```text
apps/
  web/
    src/
      app/
        page.tsx              # Main UI and wallet/identity flows
        layout.tsx            # App layout and metadata
      lib/
        binding.ts            # Challenge creation and Nostr verification
        bch-address.ts        # BCH address derivation helpers
```

The full directory layout may change as the project evolves.

## Current limitations and roadmap

The current app uses WizardConnect's BCH wallet connection and Nostr signing. WizardConnect exposes a transaction-signing request with an optional `broadcast: false` flag, but that is **not equivalent to a safe arbitrary-message ownership signature**. A correct BCH ownership proof would require careful handling of signing inputs, key paths, challenge commitments, and independent cryptographic verification.

Planned improvements:

- [ ] Add an independent BCH ownership-signing method that does not risk unintended spending.
- [ ] Verify both the BCH ownership proof and Nostr signature against the same challenge.
- [ ] Strengthen imported-proof schema checks, expiry handling, and replay protections.
- [ ] Add automated tests for valid, tampered, malformed, and expired proofs.
- [ ] Explore optional Nostr relay publishing and revocation/renewal flows.
- [ ] Document a stable, versioned proof format.

## Contributing

Issues and pull requests are welcome. For security-sensitive changes, please include tests and clearly document what the new verification logic proves. Avoid describing an identity as “fully verified” unless **both** keys have been independently authenticated.

## License

See the repository's `LICENSE` file **if present**. No license is asserted here until one has been added to the repository.

---

Built for exploring interoperability between **Bitcoin Cash** and **Nostr**.
