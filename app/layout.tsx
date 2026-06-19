import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "WC 2026 Predictions",
  description: "Predict match scores, earn points, and track your rank on the leaderboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fredoka.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans text-primary-text">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
