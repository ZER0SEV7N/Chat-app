import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
export const metadata: Metadata = {
  title: "Registro - Chat App",
  description: "Crea tu cuenta en Chat App para empezar a conversar",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return (
      <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
      </div>
  );
}