import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zust - State Management Demo",
  description: "Comprehensive demo showcasing all Zust features",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
