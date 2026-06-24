import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BirdiePool | Play. Give. Win.",
  description: "Turn every round into real impact. Track your game, support meaningful causes, and earn opportunities to win monthly rewards.",
  keywords: ["golf", "charity", "rewards", "birdiepool", "stableford", "score tracking"],
  openGraph: {
    type: "website",
    title: "BirdiePool | Play. Give. Win.",
    description: "Turn every round into real impact. Track your game, support meaningful causes, and earn opportunities to win monthly rewards.",
    siteName: "BirdiePool"
  },
  twitter: {
    card: "summary_large_image",
    title: "BirdiePool | Play. Give. Win.",
    description: "Turn every round into real impact. Track your game, support meaningful causes, and earn opportunities to win monthly rewards.",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
