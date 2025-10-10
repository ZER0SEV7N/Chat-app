import { SetStateAction, useEffect, useState } from "react";

interface Props {
    socket: any;
    channel: any;
}

export default function chatWindow({ socket, channel }: Props){
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');

    useEffect(() => {
        if (socket && channel) {
            socket.emit('joinRoom', channel.idChannel);

            const handleHistory = (history: any[]) => setMessages(history);
            const handleNewMessage = (msg: any) => {
            if (msg.channel.idChannel === channel.idChannel) {
                setMessages((prev) => [...prev, msg]);
            }
            };

            socket.on('history', handleHistory);
            socket.on('newMessage', handleNewMessage);

            return () => {
            socket.emit('leaveRoom', channel.idChannel);
            socket.off('history', handleHistory);
            socket.off('newMessage', handleNewMessage);
            };
        }
    }, [socket, channel]);


    const sendMessage = () => {
    if (socket && input.trim() !== '') {
      socket.emit('sendMessage', {
        idChannel: channel.idChannel,
        text: input,
      });
      setInput('');
    }
  };

  if (!channel)
    return <div className="chat-window-empty">Selecciona un canal para comenzar</div>;

  return (
    <div className="chat-window">
      <h3>#{channel.name}</h3>
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className="chat-msg">
            <strong>{msg.user?.username || 'Anon'}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          placeholder="Escribe un mensaje..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>Enviar</button>
      </div>
    </div>
  );

}