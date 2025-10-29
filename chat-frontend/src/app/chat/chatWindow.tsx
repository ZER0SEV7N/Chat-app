import { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { Search, Trash2, Edit3, Check, X } from "lucide-react"; // 👈 Agregamos iconos de editar/guardar/cancelar

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
  const [editingId, setEditingId] = useState<string | null>(null); // 🔹 mensaje en edición
  const [editText, setEditText] = useState(""); // 🔹 texto editado
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 🔹 Notificaciones y sonido
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
    audioRef.current = new Audio("/sounds/message.mp3");
    audioRef.current.preload = "auto";
    audioRef.current.volume = 0.7;
  }, []);

  // 🔹 Socket eventos
  useEffect(() => {
    if (!socket || !channel) return;

    socket.emit("joinRoom", channel.idChannel);

    const handleHistory = (history: any[]) => setMessages(history);

    const handleNewMessage = (msg: any) => {
      if (msg.channel.idChannel === channel.idChannel) {
        setMessages((prev) => [...prev, msg]);
      }

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

    // 🔹 Escuchar mensaje editado
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

  // 🔹 Enviar mensaje
  const sendMessage = () => {
    if (!socket || input.trim() === "") return;
    socket.emit("sendMessage", { idChannel: channel.idChannel, text: input });
    const audio = audioRef.current;
    if (audio) {
      audio.play().catch(() => {});
    }
    setInput("");
  };

  // 🔹 Eliminar mensaje
  const deleteMessage = (idMessage: string) => {
    if (!socket) return;
    socket.emit("deleteMessage", idMessage);
    setMessages((prev) => prev.filter((m) => m.idMessage !== idMessage));
  };

  // 🔹 Editar mensaje (guardar cambios)
  const saveEdit = (idMessage: string) => {
    if (!socket || editText.trim() === "") {
      setEditingId(null);
      return;
    }

    socket.emit("editMessage", { idMessage, newText: editText });

    // Actualizamos localmente para respuesta rápida
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

  // 😄 Emoji
  const handleEmojiClick = (emojiData: any) => {
    setInput((prev) => prev + emojiData.emoji);
    setShowPicker(false);
  };

  // ⏰ Hora tipo WhatsApp
  const formatHour = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // 🔍 Filtrar mensajes
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
      {/* Encabezado */}
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
          aria-label="Buscar en el chat"
          title="Buscar"
          onClick={() => setShowSearch(!showSearch)}
        >
          <Search size={20} aria-hidden="true" />
        </button>
      </div>

      {/* Barra de búsqueda */}
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

      {/* Mensajes */}
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

                {/* Solo botones para mis mensajes */}
                {isOwn && (
                  <div className="message-actions">
                    {editingId === msg.idMessage ? (
                      <>
                        <button
                          className="confirm-btn"
                          title="Guardar"
                          onClick={() => saveEdit(msg.idMessage)}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          className="cancel-btn"
                          title="Cancelar"
                          onClick={cancelEdit}
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="edit-btn"
                          title="Editar"
                          onClick={() => {
                            setEditingId(msg.idMessage);
                            setEditText(msg.text);
                          }}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="delete-btn"
                          title="Eliminar"
                          onClick={() => deleteMessage(msg.idMessage)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Si estoy editando este mensaje, muestro input */}
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

      {/* Input de nuevo mensaje */}
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
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="send-btn" onClick={sendMessage}>
          Enviar
        </button>
      </div>
    </div>
  );
}
