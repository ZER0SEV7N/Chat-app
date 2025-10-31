import React, { useState } from "react";
import "./modal.css";
import { API_URL } from "@/lib/config";

interface CreateChannelModalProps {
  onClose: () => void; // Función para cerrar el modal
  onChannelCreated: (channel: any) => void; // Función para notificar al padre que se creó un canal
}

export default function CreateChannelModal({
  onClose,
  onChannelCreated,
}: CreateChannelModalProps) {
  // Estados locales para el nombre y la descripción del canal
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Estado para evitar múltiples envíos (doble clic)
  const [isCreating, setIsCreating] = useState(false);

  /*===============================================================
  Manejar la creación del canal
  ===============================================================*/
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita recargar la página al enviar el formulario

    // Si ya se está creando un canal, evita un segundo envío
    if (isCreating) return;
    setIsCreating(true);

    try {
      // Obtener el usuario actual (asumimos que está guardado en localStorage)
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      // Verificar si el usuario está autenticado
      if (!user?.idUser) {
        alert("Error: usuario no autenticado");
        setIsCreating(false);
        return;
      }

      // Enviar la solicitud al backend
      const res = await fetch(`${API_URL}/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          creatorId: user.idUser, // Se envía el ID del creador
        }),
      });

      const data = await res.json();

      // Si la respuesta es exitosa
      if (res.ok) {
        // Notificar al componente padre para actualizar la lista de canales
        onChannelCreated(data);

        // Cerrar el modal
        onClose();
      } else {
        alert(data.message || "Error al crear el canal");
      }
    } catch (error) {
      console.error("Error al crear canal:", error);
      alert("Error al conectar con el servidor");
    } finally {
      // Restablecer el estado de creación
      setIsCreating(false);
    }
  };

  // Manejar teclas del teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  /*===============================================================
  Renderizado del modal
  ===============================================================*/
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header del modal */}
        <div className="modal-header">
          <h2>Crear Nuevo Canal</h2>
          <button 
            className="modal-close" 
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>

        {/* Formulario para crear canal */}
        <form onSubmit={handleCreate} className="modal-form">
          <div className="form-group">
            <label htmlFor="channel-name" className="form-label">
              Nombre del canal
            </label>
            <input
              id="channel-name"
              type="text"
              placeholder="Ej: Proyecto Alpha, Amigos, etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isCreating}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="channel-description" className="form-label">
              Descripción <span className="optional">(opcional)</span>
            </label>
            <textarea
              id="channel-description"
              placeholder="Describe el propósito de este canal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isCreating}
              rows={3}
            />
          </div>

          {/* Botones del modal */}
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
              disabled={isCreating}
            >
              Cancelar
            </button>
            
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={isCreating || !name.trim()}
            >
              {isCreating ? (
                <>
                  <span className="loading-spinner"></span>
                  Creando...
                </>
              ) : (
                'Crear Canal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}