import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sports Fiesta S9",
  description:
    "A live tournament command center for church sports scores, fixtures, standings, brackets, leaderboards, and audit activity.",
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
