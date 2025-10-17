"use client";
import React, { useEffect } from "react";
import "./chat.css";

interface Props {
  sender: string;
  message?: string; // opcional por seguridad
  onClose: () => void;
}

export default function FloatingNotification({ sender, message = "", onClose }: Props) {
  // 🔄 Desaparece después de 4 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // ✅ Evitar errores si message no es string
  const safeMessage = typeof message === "string" ? message : JSON.stringify(message);
  const preview = safeMessage.length > 60 ? safeMessage.substring(0, 60) + "..." : safeMessage;

  return (
    <div className="floating-notification">
      <div className="notification-body">
        <strong>{sender}</strong>
        <p>{preview}</p>
      </div>
    </div>
  );
}
