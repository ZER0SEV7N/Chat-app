import { SetStateAction, useEffect, useState } from "react";
import EmojiPicker from "emoji-picker-react";
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

    //Función para enviar mensajes
    const sendMessage = () => {
    //Si el socket existe y el input no está vacío
    if (socket && input.trim() !== '') {
      socket.emit('sendMessage', {
        idChannel: channel.idChannel,
        text: input,
      });
      setInput('');
    }
  };

  //Constante para el selector de emojis
  const handleEmojiClick = (emojiData: any) => {
    setInput((prev) => prev + emojiData.emoji);
    setShowPicker(false);
  };

  if (!channel)
    return <div className="chat-window-empty">Selecciona un canal para comenzar</div>;

  return (
    <div className="chat-window">
      <h3>#{channel.name}</h3>

      {/* 💬 Mensajes */}
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className="chat-msg">
            <strong>{msg.user?.username || "Anon"}:</strong> {msg.text}
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
