//chat-frontend/src/app/chat/page.tsx
'use client';
import { useState, useEffect } from "react";
import { ResponsiveProvider } from "./Responsive/contextResponsive";
import ChatContent from "./chatContent";

//Componente principal envuelto en el Provider
export default function ChatPage() {
  return (
    <ResponsiveProvider>
      <ChatContent />
    </ResponsiveProvider>
  );
}
