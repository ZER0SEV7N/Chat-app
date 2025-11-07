import { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { Search, Trash2, Edit3, Check, X } from "lucide-react"; //iconos extra

interface Props {
  socket: any;
  channel: any;
  onEditChannel: (channel: any) => void; // ✅ NUEVA PROP: Función para editar canal
}

// Exportar el componente principal del chat
export default function ChatWindow({ socket, channel, onEditChannel }: Props) { // ✅ RECIBIR onEditChannel
  const [messages, setMessages] = useState<any[]>([]); //estado de los mensajes
  const [input, setInput] = useState(""); //estado del input de mensaje
  const [showPicker, setShowPicker] = useState(false); //control del picker de emojis
  const [showSearch, setShowSearch] = useState(false); //control barra búsqueda
  const [searchTerm, setSearchTerm] = useState(""); //texto de búsqueda
  const [editingId, setEditingId] = useState<string | null>(null); //ID de mensaje en edición
  const [editText, setEditText] = useState(""); //texto editado
  const audioRef = useRef<HTMLAudioElement | null>(null); //Referencia al audio de notificación
  const [username, setUsername] = useState("");  //nuevo estado para el nombre de usuario
  const [currentUserId, setCurrentUserId] = useState<number | null>(null); //nuevo estado para el ID del usuario

  //Configurar notificaciones, usuario y audio
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUsername = localStorage.getItem("username") || "";
      const storedId = localStorage.getItem("idUser");
      setUsername(storedUsername);
      if (storedId) setCurrentUserId(Number(storedId));

      // Pedir permiso de notificaciones
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }

      audioRef.current = new Audio("/sounds/message.mp3");
      audioRef.current.preload = "auto";
      audioRef.current.volume = 0.7;
    }
  }, []);

  //Manejar conexión de socket y eventos
  useEffect(() => {
    if (!socket || !channel) return;

    //Limpieza de eventos anteriores para evitar duplicados
    socket.off("history");
    socket.off("newMessage");
    socket.off("messageDeleted");
    socket.off("messageEdited");

    //Unirse al canal actual
    socket.emit("joinRoom", channel.idChannel);

    //Cargar historial
    const handleHistory = (history: any[]) => setMessages(history);

    //Nuevo mensaje recibido
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

    //Mensaje eliminado
    const handleDeletedMessage = (idMessage: string) => {
      setMessages((prev) => prev.filter((m) => m.idMessage !== idMessage));
    };

    //Mensaje editado
    const handleEditedMessage = (updatedMsg: any) => {
      setMessages((prev) =>
        prev.map((m) => (m.idMessage === updatedMsg.idMessage ? updatedMsg : m))
      );
    };

    //Escuchar eventos
    socket.on("history", handleHistory);
    socket.on("newMessage", handleNewMessage);
    socket.on("messageDeleted", handleDeletedMessage);
    socket.on("messageEdited", handleEditedMessage);

    //Limpieza al salir o cambiar de canal
    return () => {
      socket.emit("leaveRoom", channel.idChannel);
      socket.off("history", handleHistory);
      socket.off("newMessage", handleNewMessage);
      socket.off("messageDeleted", handleDeletedMessage);
      socket.off("messageEdited", handleEditedMessage);
    };
  }, [socket, channel]);

  //Enviar mensaje
  const sendMessage = () => {
    if (!socket || input.trim() === "") return;
    socket.emit("sendMessage", { idChannel: channel.idChannel, text: input });
    setInput("");
  };

  //Eliminar mensaje
  const deleteMessage = (idMessage: string) => {
    if (!socket) return;
    socket.emit("deleteMessage", idMessage);
    setMessages((prev) => prev.filter((m) => m.idMessage !== idMessage));
  };

  //Guardar edición
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

  //Cancelar edición
  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  //Agregar emoji
  const handleEmojiClick = (emojiData: any) => {
    setInput((prev) => prev + emojiData.emoji);
    setShowPicker(false);
  };

  //Formatear hora tipo WhatsApp
  const formatHour = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  //Filtrar mensajes
  const filteredMessages = messages.filter((msg) =>
    msg.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!channel)
    return (
      <div className="chat-empty">
        <p className="chat-empty-message"> Selecciona un Grupo para comenzar a chatear 💬</p>
      </div>
    );

  return (
    <div className="chat-container">
      {/*Encabezado */}
      <div className="chat-header">
        <div className="chat-header-info">
          <h2>#{channel.name}</h2>
          <p className="chat-description">
            {channel.description || "Sin descripción disponible"}
          </p>
        </div>
      
        <div className="chat-header-actions">
          {/* Botón de edición de canal - SOLO para grupos, NO para DMs */}
          {channel.creator?.username === username && 
          !channel.name?.startsWith("DM ") && (
            <button
              type="button"
              className="edit-channel-btn"
              title="Editar canal"
              onClick={() => {
                console.log('🔄 Abriendo modal de edición para:', channel.name);
                onEditChannel(channel); // ✅ LLAMAR A LA FUNCIÓN DEL PADRE
              }}
            >
              <Edit3 size={18} />
            </button>
          )}

          {/* Botón de búsqueda */}
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
      </div>

      {/*Barra de búsqueda */}
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
            searchTerm && msg.text.toLowerCase().includes(searchTerm.toLowerCase());

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
                  {/* Solo mis mensajes pueden editarse o eliminarse */}
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
                </span>
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

      {/* Input */}
      <div className="chat-input-container">
        <button className="emoji-btn" onClick={() => setShowPicker(!showPicker)}>
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

      {/* ❌ ELIMINADO: Ya no necesitamos renderizar el modal aquí */}
      {/* El modal se renderiza en page.tsx junto con los otros modales */}
    </div>
  );
}