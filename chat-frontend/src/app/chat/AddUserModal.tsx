import { useState } from 'react';
import './modal.css';
interface AddUserModalProps {
  onClose: () => void;
  onChannelCreated: (channel: any) => void;
  channels : any[];
}

export default function AddUserModal({ onClose, onChannelCreated, channels }: AddUserModalProps) {
  const [username, setUsername] = useState('');

  const handleAdd = async () => {
    const token = localStorage.getItem('token');
    if (!token) return alert("Debes iniciar sesión");

    //Verificar si ya existe el DM con este usuario
    const existing = channels.find(ch => !ch.isPublic && ch.targetUsername === username);
    if (existing) {
      alert(`Ya tienes un DM con ${username}`);
      return;
    }      
    const res = await fetch('http://localhost:3000/chat/private', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ targetUsername: username }),
    });

    if (res.ok) {
      const data = await res.json();
      onChannelCreated(data); // ✅ Notifica al componente principal
      onClose();
    } else {
      alert('No se pudo crear el canal privado');
    }

    setUsername('');
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Contactar usuario</h3>
        <input
          placeholder="Username del usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <div className="modal-buttons">
          <button onClick={handleAdd}>Contactar</button>
          <button onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
