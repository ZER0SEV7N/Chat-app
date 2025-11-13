//src/app/chat/ChatWindow.tsx
//Componente de la ventana de chat
//Importaciones necesarias:
import { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { Search, MoreVertical, Edit2, Trash2, Check, X, Users, Edit3, ArrowLeft, } from "lucide-react";
import socket from "../../lib/socket";
import { Socket } from "socket.io-client";
import { useResponsiveContext } from "./Responsive/contextResponsive";
import "./chat.css";
import "./chat-responsive.css";
import "./chat-dark.css";

// ===============================================================
// 🧱 PROPIEDADES DEL COMPONENTE
// ===============================================================
interface Props {
  socket: Socket | null;
  channel: any;
  onEditChannel: (channel: any) => void;
  onBackToList?: () => void;
}

export default function ChatWindow({ channel, onEditChannel, onBackToList  }: Props) {
  // ===============================================================
  // 🧠 ESTADOS PRINCIPALES
  // ===============================================================
  const { isMobile } = useResponsiveContext(); // Contexto para diseño responsivo
  const [messages, setMessages] = useState<any[]>([]); // Lista de mensajes
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]); // Usuarios conectados
  const [input, setInput] = useState(""); // Texto del input de envío
  const [showPicker, setShowPicker] = useState(false); // Mostrar/ocultar selector de emojis
  const [showSearch, setShowSearch] = useState(false); // Mostrar/ocultar barra de búsqueda
  const [searchTerm, setSearchTerm] = useState(""); // Texto de búsqueda
  const [editingId, setEditingId] = useState<string | null>(null); // ID del mensaje en edición
  const [editText, setEditText] = useState(""); // Texto del mensaje editado
  const [menuOpen, setMenuOpen] = useState<string | null>(null); // Menú contextual abierto (⋮)
  const [username, setUsername] = useState<string>(""); // Nombre del usuario actual - TIPO CORREGIDO

  // Referencias para audio y scroll automático
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // ===============================================================
  // ⚙️ CONFIGURACIÓN INICIAL: Usuario, Audio y Eventos de Foco
  // ===============================================================
  useEffect(() => {
    // Cargar usuario desde localStorage
    const storedUsername = localStorage.getItem("username") || "";
    setUsername(storedUsername);

    // Configurar sonido de notificación
    audioRef.current = new Audio("/sounds/message.mp3");
    audioRef.current.volume = 0.7;

    // Pedir permiso de notificaciones del navegador
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ===============================================================
  // 🔽 AUTO-SCROLL: Desplaza automáticamente al último mensaje
  // ===============================================================
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ===============================================================
  // 🔌 CONEXIÓN SOCKET.IO: Manejo de eventos en tiempo real
  // ===============================================================
  useEffect(() => {
    if (!socket?.connected || !channel) return;

    // Unirse a la sala actual del canal
    socket.emit("joinRoom", channel.idChannel);

    // --- EVENTOS DEL SERVIDOR ---
    const handleHistory = (history: any[]) => setMessages(history);

    const handleNewMessage = (msg: any) => {
      // Ignorar mensajes que no pertenecen al canal actual
      if (msg.channel.idChannel !== channel.idChannel) return;

      // Evitar duplicados de mensajes
      setMessages((prev) => {
        const exists = prev.some((m) => m.idMessage === msg.idMessage);
        return exists ? prev : [...prev, msg];
      });

      // Si el mensaje no es del usuario actual → reproducir sonido y notificación
      if (msg.user?.username !== username) {
        audioRef.current?.play().catch(() => {});
        if ("Notification" in window && Notification.permission === "granted") {
          const notif = new Notification(`💬 ${msg.user?.username}`, {
            body: msg.text,
            icon: "/favicon.ico",
            silent: true,
          });
          notif.onclick = () => notif.close();
        }
      }
    }; // ← FALTABA ESTA LLAVE DE CIERRE

    const handleDeleted = (idMessage: string) =>
      setMessages((prev) => prev.filter((m) => m.idMessage !== idMessage));

    const handleEdited = (msg: any) =>
      setMessages((prev) =>
        prev.map((m) => (m.idMessage === msg.idMessage ? msg : m))
      );

    const handleOnlineUsers = (users: any[]) => setOnlineUsers(users);

    // --- ESCUCHAR EVENTOS DEL SERVIDOR ---
    socket.on("history", handleHistory);
    socket.on("newMessage", handleNewMessage);
    socket.on("messageDeleted", handleDeleted);
    socket.on("messageEdited", handleEdited);
    socket.on("onlineUsers", handleOnlineUsers);

    // --- LIMPIEZA ---
    return () => {
      socket.emit("leaveRoom", channel.idChannel);
      socket.off("history", handleHistory);
      socket.off("newMessage", handleNewMessage);
      socket.off("messageDeleted", handleDeleted);
      socket.off("messageEdited", handleEdited);
      socket.off("onlineUsers", handleOnlineUsers);
    };
  }, [channel, username]); // ← DEPENDENCIAS CORRECTAS

  // ===============================================================
  // 📨 ENVÍO DE MENSAJE
  // ===============================================================
  const sendMessage = () => {
    if (!input.trim() || !socket?.connected) return;
    socket.emit("sendMessage", { idChannel: channel.idChannel, text: input });
    setInput("");
  };

  // ===============================================================
  // 🗑️ ELIMINAR Y ✏️ EDITAR MENSAJES
  // ===============================================================
  const deleteMessage = (idMessage: string) => {
    socket.emit("deleteMessage", idMessage);
  };

  const saveEdit = (idMessage: string) => {
    if (!editText.trim()) return;
    socket.emit("editMessage", { idMessage, newText: editText });
    setEditingId(null);
    setEditText("");
  };

  // ===============================================================
  // ⏰ FORMATO DE FECHA Y HORA (tipo WhatsApp)
  // ===============================================================
  const formatHour = (date: string) =>
    new Date(date).toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Hoy";
    if (date.toDateString() === yesterday.toDateString()) return "Ayer";

    return date.toLocaleDateString("es-PE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Agrupar mensajes por día
  const groupMessagesByDay = (msgs: any[]) => {
    const groups: Record<string, any[]> = {};
    msgs.forEach((m) => {
      const key = new Date(m.createdAt).toDateString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return groups;
  };

  // Filtrar mensajes por búsqueda
  const filteredMessages = messages.filter((m) =>
    m.text.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const groupedMessages = groupMessagesByDay(filteredMessages);

  // ===============================================================
  // 🧱 RENDER PRINCIPAL
  // ===============================================================
  if (!channel)
    return (
      <div className="chat-empty">
        <p>Selecciona un canal para comenzar 💬</p>
      </div>
    );

  return (
    <div className="chat-container">
      {/* ================= ENCABEZADO DEL CHAT ================= */}
      <div className="chat-header">
         {/* 🎯 BOTÓN DE RETROCESO - SOLO EN MÓVIL */}
        {isMobile && onBackToList && (
          <button 
            className="back-to-list"
            onClick={onBackToList}
            title="Volver a la lista de chats"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="chat-header-info">
          <h2>#{channel.name}</h2>
          <p>{channel.description || "Sin descripción disponible"}</p>
        </div>

        {/* Usuarios conectados Unicamente para grupos*/}
        {channel.type === 'channel' && (
          <div className="chat-online-users">
            <Users size={18} />
            {onlineUsers.length > 0 ? (
              <span>{onlineUsers.map((u) => u.username).join(", ")}</span>
            ) : (
              <span className="no-users">No hay usuarios conectados</span>
            )}
          </div>
        )}

        {/* Acciones del encabezado */}
        <div className="chat-header-actions">
          {/* Solo el creador puede editar el canal */}
          {channel.creator?.username === username && channel.type === 'channel' &&(
            <button
              className="edit-channel-btn"
              title="Editar canal"
              onClick={() => onEditChannel(channel)}
            >
              <Edit3 size={18} />
            </button>
          )}

          <button
            type="button"
            className="search-btn"
            title="Buscar"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search size={20} />
          </button>
        </div>
      </div>

      {/* ================= BARRA DE BÚSQUEDA ================= */}
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

      {/* ================= MENSAJES AGRUPADOS ================= */}
      <div className="chat-messages">
        {Object.entries(groupedMessages).map(([dateKey, msgs]) => (
          <div key={dateKey}>
            <div className="day-separator">
              <span>{formatDate(msgs[0].createdAt)}</span>
            </div>

            {msgs.map((msg) => {
              const isOwn = msg.user?.username === username;
              return (
                <div
                  key={msg.idMessage}
                  className={`chat-message ${isOwn ? "own-message" : ""}`}
                >
                  <div className="chat-message-header">
                    <span className="chat-username-messages">
                      {msg.user?.username || "Anon"}:
                    </span>

                    {/* Opciones solo para mis mensajes */}
                    {isOwn && (
                      <div className="message-actions">
                        {editingId === msg.idMessage ? (
                          <>
                            <button onClick={() => saveEdit(msg.idMessage)}>
                              <Check size={14} />
                            </button>
                            <button onClick={() => setEditingId(null)}>
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <div className="menu-container">
                            <button
                              className="menu-btn"
                              onClick={() =>
                                setMenuOpen(
                                  menuOpen === msg.idMessage
                                    ? null
                                    : msg.idMessage
                                )
                              }
                            >
                              <MoreVertical size={16} />
                            </button>
                            {menuOpen === msg.idMessage && (
                              <div className="menu-popup">
                                <button
                                  onClick={() => {
                                    setEditingId(msg.idMessage);
                                    setEditText(msg.text);
                                    setMenuOpen(null);
                                  }}
                                >
                                  <Edit2 size={14} /> Editar
                                </button>
                                <button
                                  onClick={() => {
                                    deleteMessage(msg.idMessage);
                                    setMenuOpen(null);
                                  }}
                                >
                                  <Trash2 size={14} /> Eliminar
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Campo editable o texto normal */}
                  {editingId === msg.idMessage ? (
                    <input
                      type="text"
                      className="edit-input"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && saveEdit(msg.idMessage)
                      }
                      autoFocus
                    />
                  ) : (
                    <span>{msg.text}</span>
                  )}

                  {/* Hora del mensaje */}
                  <div className="chat-time">{formatHour(msg.createdAt)}</div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Elemento invisible para mantener el scroll abajo */}
        <div ref={messageEndRef} />
      </div>

      {/* ================= INPUT DE MENSAJE ================= */}
      <div className="chat-input-container">
        <button
          className="emoji-btn"
          title="Insertar emoji"
          onClick={() => setShowPicker(!showPicker)}
        >
          😀
        </button>

        {showPicker && (
          <div className="emoji-picker">
            <EmojiPicker onEmojiClick={(e) => setInput(input + e.emoji)} />
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