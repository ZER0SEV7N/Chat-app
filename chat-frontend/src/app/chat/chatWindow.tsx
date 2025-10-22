import { useEffect, useState } from "react";
import EmojiPicker from "emoji-picker-react";

interface Props {
  socket: any;
  channel: any;
  username: string;
}

export default function ChatWindow({ socket, channel, username }: Props) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  // 📡 Conexión al canal y recepción de mensajes
  useEffect(() => {
    if (socket && channel) {
      socket.emit("joinRoom", channel.idChannel);

      const handleHistory = (history: any[]) => setMessages(history);
      const handleNewMessage = (msg: any) => {
        if (msg.channel.idChannel === channel.idChannel) {
          setMessages((prev) => [...prev, msg]);
        }
      };

      const handleDeletedMessage = (deletedId: string) => {
        setMessages((prev) => prev.filter((m) => m.idMessage !== deletedId));
      };

      socket.on("history", handleHistory);
      socket.on("newMessage", handleNewMessage);
      socket.on("messageDeleted", handleDeletedMessage);

      return () => {
        socket.emit("leaveRoom", channel.idChannel);
        socket.off("history", handleHistory);
        socket.off("newMessage", handleNewMessage);
        socket.off("messageDeleted", handleDeletedMessage);
      };
    }

    setMessages([]);
  }, [socket, channel]);

  // ✉️ Enviar mensaje
  const sendMessage = () => {
    if (socket && input.trim() !== "") {
      socket.emit("sendMessage", {
        idChannel: channel.idChannel,
        text: input,
      });
      setInput("");
    }
  };

  // 🗑️ Eliminar mensaje
  const handleDeleteMessage = (msg: any) => {
    if (socket && msg.idMessage) {
      socket.emit("deleteMessage", msg.idMessage);
      setMessages((prev) => prev.filter((m) => m.idMessage !== msg.idMessage));
    }
  };

  // 😄 Selector de emojis
  const handleEmojiClick = (emojiData: any) => {
    setInput((prev) => prev + emojiData.emoji);
    setShowPicker(false);
  };

  if (!channel)
    return (
      <div className="chat-window-empty">
        <p>Selecciona un canal para comenzar</p>
      </div>
    );

  return (
    <div className="chat-window">
      {/* Título del canal */}
      <div className="chat-header">
        <h3>#{channel.name}</h3>
      </div>

      {/* 💬 Mensajes */}
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-msg ${
              msg.user?.username === username ? "own-msg" : ""
            }`}
          >
            <div className="msg-content">
              <div className="msg-header">
                <strong>{msg.user?.username || "Anon"}:</strong>
                <span className="msg-time">
                  {msg.time || new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="msg-text">{msg.text}</div>
            </div>
            <button
              className="delete-msg-btn"
              onClick={() => handleDeleteMessage(msg)}
              title="Eliminar mensaje"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {/* 💬 Input con emojis */}
      <div className="chat-input">
        <button
          type="button"
          className="emoji-btn"
          onClick={() => setShowPicker(!showPicker)}
        >
          😀
        </button>

        {showPicker && (
          <div className="emoji-picker-container">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}

        <input
          type="text"
          placeholder="Escribe un mensaje..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />

        <button onClick={sendMessage}>Enviar</button>
      </div>
    </div>
  );
}
