//chat-frontend/src/app/chat/layout.tsx
//Layout del chat
//Importaciones necesarias:
import type { Metadata } from "next"; // Importar Metadata desde next
import { Geist, Geist_Mono } from "next/font/google"; // Importar fuentes de Google
import Providers from "./provider";
import "./chat.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chat App",
  description: "Pagina del chat, donde puedes chatear con otros usuarios en tiempo real.",

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers> {/* ← Envolver con el provider */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
