import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ChatAssistant } from "@/components/chat-assistant";
import { BottomNav } from "@/components/bottom-nav";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SGKB Clanky",
  description: "SGKB Clanky",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased max-w-screen-md mx-auto`}
      >
        <div className="h-screen flex flex-col">
          <main className="flex-1 overflow-auto pb-20 no-scrollbar">
            {children}
          </main>
          <BottomNav />
        </div>
        <div className="max-w-screen-md mx-auto relative">
          <ChatAssistant />
        </div>
      </body>
    </html>
  );
}
