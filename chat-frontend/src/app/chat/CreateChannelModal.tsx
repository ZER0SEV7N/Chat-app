import React, { useState } from "react";
import './modal.css';

interface CreateChannelModalProps {
  onClose: () => void;
  onChannelCreated: (channel: any) => void;
}

export default function CreateChannelModal({ onClose, onChannelCreated }: CreateChannelModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); //evita recargar la página al enviar el form
    try {
      const res = await fetch('http://localhost:3000/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      const data = await res.json();

      if (res.ok) {
        onChannelCreated(data);
        onClose(); // ✅ cierra el modal después de crear
      } else {
        alert(data.message || "Error al crear el canal");
      }
    } catch (error) {
      console.error("Error al crear canal:", error);
      alert("Error al conectar con el servidor");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Nuevo Canal</h2>
        <form onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Nombre del canal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <textarea
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="modal-buttons">
            <button type="submit" className="btn-primary">Crear</button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
