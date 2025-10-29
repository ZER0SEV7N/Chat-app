import { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { Search, Trash2, Edit3, Check, X, MoreVertical } from "lucide-react"; // 👈 Agregamos los 3 puntos

interface Props {
  socket: any;
  channel: any;
}

export default function ChatWindow({ socket, channel }: Props) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null); // 👈 Control menú de 3 puntos
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    audioRef.current = new Audio("/sounds/message.mp3");
    audioRef.current.preload = "auto";
    audioRef.current.volume = 0.7;
  }, []);

  useEffect(() => {
    if (!socket || !channel) return;

    socket.off("history");
    socket.off("newMessage");
    socket.off("messageDeleted");
    socket.off("messageEdited");

    socket.emit("joinRoom", channel.idChannel);

    const handleHistory = (history: any[]) => setMessages(history);

    const handleNewMessage = (msg: any) => {
      if (msg.channel.idChannel !== channel.idChannel) return;

      setMessages((prev) => {
        const exists = prev.some((m) => m.idMessage === msg.idMessage);
        return exists ? prev : [...prev, msg];
      });

      const currentUser = localStorage.getItem("username");
      const audio = audioRef.current;

      if (msg.user?.username !== currentUser && audio) {
        audio.play().catch(() => {});
        if ("Notification" in window && Notification.permission === "granted") {
          const notif = new Notification(
            `💬 ${msg.user?.username || "Usuario"} te envió un mensaje`,
            {
              body: msg.text,
              icon: "/favicon.ico",
              silent: true,
              requireInteraction: true,
            }
          );
          notif.onclick = () => {
            window.focus();
            notif.close();
          };
        }
      }
    };

    const handleDeletedMessage = (idMessage: string) => {
      setMessages((prev) => prev.filter((m) => m.idMessage !== idMessage));
    };

    const handleEditedMessage = (updatedMsg: any) => {
      setMessages((prev) =>
        prev.map((m) => (m.idMessage === updatedMsg.idMessage ? updatedMsg : m))
      );
    };

    socket.on("history", handleHistory);
    socket.on("newMessage", handleNewMessage);
    socket.on("messageDeleted", handleDeletedMessage);
    socket.on("messageEdited", handleEditedMessage);

    return () => {
      socket.emit("leaveRoom", channel.idChannel);
      socket.off("history", handleHistory);
      socket.off("newMessage", handleNewMessage);
      socket.off("messageDeleted", handleDeletedMessage);
      socket.off("messageEdited", handleEditedMessage);
    };
  }, [socket, channel]);

  const sendMessage = () => {
    if (!socket || input.trim() === "") return;
    socket.emit("sendMessage", { idChannel: channel.idChannel, text: input });
    setInput("");
  };

  const deleteMessage = (idMessage: string) => {
    if (!socket) return;
    socket.emit("deleteMessage", idMessage);
    setMessages((prev) => prev.filter((m) => m.idMessage !== idMessage));
  };

  const saveEdit = (idMessage: string) => {
    if (!socket || editText.trim() === "") return;
    socket.emit("editMessage", { idMessage, newText: editText });
    setMessages((prev) =>
      prev.map((m) =>
        m.idMessage === idMessage ? { ...m, text: editText } : m
      )
    );
    setEditingId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleEmojiClick = (emojiData: any) => {
    setInput((prev) => prev + emojiData.emoji);
    setShowPicker(false);
  };

  const formatHour = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const filteredMessages = messages.filter((msg) =>
    msg.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!channel)
    return (
      <div className="chat-empty">
        <p>Selecciona un canal para comenzar a chatear 💬</p>
      </div>
    );

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-info">
          <h2>#{channel.name}</h2>
          <p className="chat-description">
            {channel.description || "Sin descripción disponible"}
          </p>
        </div>

        <button
          type="button"
          className="search-btn"
          onClick={() => setShowSearch(!showSearch)}
        >
          <Search size={20} />
        </button>
      </div>

      {showSearch && (
        <div className="chat-search-bar">
          <input
            type="text"
            placeholder="Buscar en el chat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      <div className="chat-messages">
        {filteredMessages.map((msg, i) => {
          const isOwn = msg.user?.username === localStorage.getItem("username");
          const highlight =
            searchTerm &&
            msg.text.toLowerCase().includes(searchTerm.toLowerCase());

          return (
            <div
              key={msg.idMessage || i}
              className={`chat-message ${isOwn ? "own-message" : ""} ${
                highlight ? "highlight" : ""
              }`}
            >
              <div className="chat-message-header">
                <span className="chat-username-messages">
                  {msg.user?.username || "Anon"}:
                </span>

                {isOwn && (
                  <div className="message-actions">
                    <button
                      className="menu-btn"
                      onClick={() =>
                        setMenuOpenId(
                          menuOpenId === msg.idMessage ? null : msg.idMessage
                        )
                      }
                    >
                      <MoreVertical size={16} />
                    </button>

                    {menuOpenId === msg.idMessage && (
                      <div className="message-menu">
                        <button
                          onClick={() => {
                            setEditingId(msg.idMessage);
                            setEditText(msg.text);
                            setMenuOpenId(null);
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => {
                            deleteMessage(msg.idMessage);
                            setMenuOpenId(null);
                          }}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {editingId === msg.idMessage ? (
                <input
                  type="text"
                  className="edit-input"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit(msg.idMessage)}
                  autoFocus
                />
              ) : (
                <span>{msg.text}</span>
              )}

              <div className="chat-time">
                {formatHour(msg.createdAt || new Date().toISOString())}
              </div>
            </div>
          );
        })}
      </div>

      <div className="chat-input-container">
        <button
          className="emoji-btn"
          onClick={() => setShowPicker(!showPicker)}
        >
          😀
        </button>

        {showPicker && (
          <div className="emoji-picker">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}

        <input
          type="text"
          placeholder="Escribe un mensaje..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="send-btn" onClick={sendMessage}>
          Enviar
        </button>
      </div>
    </div>
  );
}
