import { useState } from 'react';
import './modal.css';
import { API_URL } from '@/lib/config';

interface AddUserModalProps {
  onClose: () => void;
  onChannelCreated: (channel: any) => void;
  channels: any[];
}

export default function AddUserModal({ onClose, onChannelCreated, channels }: AddUserModalProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    if (!username.trim()) {
      alert('Por favor ingresa un nombre de usuario');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert("Debes iniciar sesión");
      return;
    }

    // Verificar si ya existe el DM con este usuario
    const existing = channels.find(ch => !ch.isPublic && ch.targetUsername === username);
    if (existing) {
      alert(`Ya tienes un mensaje directo con ${username}`);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat/private`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUsername: username }),
      });

      if (res.ok) {
        const data = await res.json();
        onChannelCreated(data);
        onClose();
      } else {
        const error = await res.text();
        alert(`No se pudo crear el chat privado: ${error}`);
      }
    } catch (error) {
      alert('Error de conexión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
      setUsername('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Iniciar Chat Privado</h3>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <p>Ingresa el nombre de usuario para iniciar una conversación privada</p>
          <input
            type="text"
            placeholder="Nombre de usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
            autoFocus
          />
        </div>

        <div className="modal-footer">
          <button 
            className="btn-secondary" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button 
            className="btn-primary" 
            onClick={handleAdd}
            disabled={isLoading || !username.trim()}
          >
            {isLoading ? 'Creando...' : 'Iniciar Chat'}
          </button>
        </div>
      </div>
    </div>
  );
}