"use client";
import { useState, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";


interface Props {
  socket: any;
  channel: any;
}

export default function ChatWindow({ socket, channel }: Props) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const currentUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    if (!socket || !channel) return;

    const handleHistory = (history: any[]) => {
      const formatted = history.map((msg) => ({
        senderId: msg.user?.id || "",
        senderName: msg.user?.username || "Anon",
        content: msg.text,
        channelId: msg.channelId || msg.channel?.idChannel,
        createdAt: msg.createdAt,
      }));
      setMessages(formatted);
    };

    const handleNewMessage = (msg: any) => {
      if (msg.channelId !== channel.idChannel) return; // solo este canal
      setMessages((prev) => [...prev, msg]);
    };

    socket.emit("joinRoom", channel.idChannel);
    socket.on("history", handleHistory);
    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.emit("leaveRoom", channel.idChannel);
      socket.off("history", handleHistory);
      socket.off("newMessage", handleNewMessage);
      setMessages([]);
    };
  }, [socket, channel]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit("sendMessage", { idChannel: channel.idChannel, text: input });
    setInput("");
  };

  const handleEmojiClick = (emojiData: any) => {
    setInput((prev) => prev + emojiData.emoji);
    setShowPicker(false);
  };

  if (!channel) return <div className="chat-window-empty">Selecciona un canal</div>;

  return (
    <div className="chat-window flex flex-col h-full">
      <h3>#{channel.name}</h3>

      <div className="chat-messages flex-1 overflow-y-auto p-2">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg ${msg.senderId === currentUserId ? "own" : ""}`}>
            <strong>{msg.senderName}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <div className="chat-input flex items-center p-2">
        <button type="button" onClick={() => setShowPicker(!showPicker)}>😀</button>
        {showPicker && <EmojiPicker onEmojiClick={handleEmojiClick} />}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Escribe un mensaje..."
          className="flex-1 mx-2"
        />
        <button onClick={sendMessage}>Enviar</button>
      </div>
    </div>
  );
}
