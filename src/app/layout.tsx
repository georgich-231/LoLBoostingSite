import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/footer";
import { Navigation } from "@/components/navigation";
import { SupportAssistant } from "@/components/support-assistant";
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
  title: "RiftProgress | League Boosting Services and Order Tracking",
  description:
    "A League of Legends boosting marketplace for division boosts, net wins, placements, duo boosts, pay-per-game orders, rank-aware pricing, and order tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full bg-zinc-950 text-zinc-100">
        <Navigation />
        {children}
        <Footer />
        <SupportAssistant />
      </body>
    </html>
  );
}
