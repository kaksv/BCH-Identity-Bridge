
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BCH Identity Bridge | Self-Sovereign Identity",
  description:
    "Cryptographically connect Bitcoin Cash and Nostr identities. One identity. Two networks. Verifiable trust.",
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
