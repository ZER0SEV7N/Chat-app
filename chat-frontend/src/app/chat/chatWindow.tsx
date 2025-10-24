import { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { Search } from "lucide-react"; // 👈 para el ícono de lupa
//Definir las props que recibirá el componente
interface Props {
    socket: any;
    channel: any;
}
//Exportar la función chatWindow
export default function chatWindow({ socket, channel }: Props){
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    const [showSearch, setShowSearch] = useState(false); // 🔍 control de barra de búsqueda
    const [searchTerm, setSearchTerm] = useState(""); // texto de búsqueda
    const audioRef = useRef<HTMLAudioElement | null>(null);
    //Efecto para manejar la conexión del socket y los mensajes
    useEffect(() => {
        //Unirse a la sala del canal
        //Si el socket y el canal existen
        if (socket && channel) {
          //Emitir evento para unirse a la sala del canal
            socket.emit('joinRoom', channel.idChannel);
            //Recuperar el historial de mensajes
            const handleHistory = (history: any[]) => setMessages(history);
            //Manejar nuevos mensajes
            const handleNewMessage = (msg: any) => {
            //Agregar el nuevo mensaje si pertenece al canal actual
              if (msg.channel.idChannel === channel.idChannel) {
                  setMessages((prev) => [...prev, msg]);
             }
            };
            //Escuchar eventos del socket
            socket.on('history', handleHistory);
            socket.on('newMessage', handleNewMessage);
            //Función de limpieza para salir de la sala y remover listeners
            return () => {
            socket.emit('leaveRoom', channel.idChannel);
            socket.off('history', handleHistory);
            socket.off('newMessage', handleNewMessage);
            };
        }
        //Limpiar mensajes al cambiar de canal
        setMessages([]);
    //Volver a ejecutar el efecto si cambian socket o canal
    }, [socket, channel]);
     //Bajar el scroll automáticamente al recibir nuevos mensajes
    useEffect(() => {
      const container = document.querySelector(".chat-messages");
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, [messages]); //Se ejecuta cada vez que llegan nuevos mensajes
  // 🔹 Pedir permiso de notificación al cargar
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

  // 🔹 Escuchar mensajes entrantes
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
        audio.play().catch(() => { });
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

    socket.on("history", handleHistory);
    socket.on("newMessage", handleNewMessage);
    return () => {
      socket.emit("leaveRoom", channel.idChannel);
      socket.off("history", handleHistory);
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, channel]);

  // 🔹 Enviar mensaje
  const sendMessage = () => {
    if (!socket || input.trim() === "") return;
    socket.emit("sendMessage", { idChannel: channel.idChannel, text: input });
    const audio = audioRef.current;
    if (audio) {
      audio.play().catch(() => { });
    }
    setInput("");
  };

  // 😄 Agregar emoji
  const handleEmojiClick = (emojiData: any) => {
    setInput((prev) => prev + emojiData.emoji);
    setShowPicker(false);
  };

  // ⏰ Formatear hora tipo WhatsApp
  const formatHour = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // 🔍 Filtrar mensajes por búsqueda
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
      {/* 🔹 Encabezado */}
      <div className="chat-header">
        <div className="chat-header-info">
          <h2>#{channel.name}</h2>
          <p className="chat-description">
            {channel.description || "Sin descripción disponible"}
          </p>
        </div>

        {/* 🔍 Botón de búsqueda */}
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
              key={i}
              className={`chat-message ${isOwn ? "own-message" : ""} ${highlight ? "highlight" : ""
                }`}
            >
              <span className="chat-username-messages">
                {msg.user?.username || "Anon"}:
              </span>{" "}
              <span>{msg.text}</span>
              <div className="chat-time">
                {formatHour(msg.createdAt || new Date().toISOString())}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
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
