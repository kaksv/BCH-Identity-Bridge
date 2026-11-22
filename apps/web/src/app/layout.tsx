
import type { Metadata } from "next";
import "./globals.css";

export const metadata = {
  title: "BCH Identity Bridge | Bitcoin Cash × Nostr",
  description:
    "Connect Bitcoin Cash and Nostr identities, create signed identity claims, and independently verify Nostr attestations.",
  applicationName: "BCH Identity Bridge",
  keywords: [
    "Bitcoin Cash",
    "BCH",
    "Nostr",
    "Decentralized Identity",
    "Paytaca",
    "WizardConnect",
    "Identity Attestation",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
