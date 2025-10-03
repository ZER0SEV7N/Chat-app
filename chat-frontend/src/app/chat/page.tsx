"use client";
import { useEffect, useState } from "react";
import socket from "@/lib/socket";

export default function ChatRoom({roomID}: {roomID: string}) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{user: string, text: string}[]>([]);
  const [input, setInput] = useState("");

    useEffect(() => {
        socket.emit("joinRoom", roomID);

        socket.on("newMessage", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });
        return () => {
            socket.emit("leaveRoom", roomID);
            socket.off("newMessage");
        };
    }, [roomID]);

    const sendMessage = () => {
        if (message.trim() !== "") {
            socket.emit("sendMessage", { roomID, text: input });
            setMessage("");
        }};
    return (
    <div className="p-4 border rounded-lg w-[400px]">
      <div className="h-[300px] overflow-y-auto border-b mb-2">
        {messages.map((m, i) => (
          <p key={i}><b>{m.user}:</b> {m.text}</p>
        ))}
      </div>
      <div className="flex">
        <input
          className="flex-1 border p-2"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
        />
        <button className="bg-blue-500 text-white px-4" onClick={sendMessage}>
          Enviar
        </button>
      </div>
    </div>
  );
}