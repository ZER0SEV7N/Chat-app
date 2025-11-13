//src/app/chat/Modal/CreateChannelModal.tsx
//Modal para crear un canal de usuario
import React, { useState } from "react";
import "./modal.css";
import { API_URL } from "@/lib/config";

interface CreateChannelModalProps {
  onClose: () => void;
  onChannelCreated: (channel: any) => void;
}

//Decodificar el token JWT (base64)
function getUserIdFromToken(token: string | null) {
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    const data = JSON.parse(atob(payload));
    // tu JwtGuard usa `req.user.sub`, por tanto el ID está en "sub"
    return data.sub || data.idUser || data.userId || null;
  } catch {
    return null;
  }
}

export default function CreateChannelModal({
  onClose,
  onChannelCreated,
}: CreateChannelModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true); // ✅ NUEVO: Estado para controlar si el canal es público o privado
  // Estado para evitar múltiples envíos (doble clic)
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita recargar la página al enviar el formulario
    // Si ya se está creando un canal, evita un segundo envío
    if (isCreating) return;
    setIsCreating(true);

    try {
      // Obtener el usuario actual (asumimos que está guardado en localStorage)
      const token = localStorage.getItem("token");


      //Verificar si el usuario está autenticado
      if(!token){
        alert("Error: usuario no autenticado");
        return;
      }
      // ✅ Extraer idUser directamente del token JWT
      const creatorId = getUserIdFromToken(token);
      if (!creatorId) {
        alert("No se pudo obtener el ID del usuario del token");
        setIsCreating(false);
        return;
      }

      //Enviar la solicitud al backend
      const res = await fetch(`${API_URL}/channels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name,
          description,
          creatorId, // Se envía el ID del creador
          isPublic, // ✅ NUEVO: Se envía si el canal es público o privado
          type: "channel" // ✅ NUEVO: Se especifica explícitamente que es un canal, no un DM
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Asegurar que el canal tenga el tipo correcto
        const channelWithType = {
          ...data,
          type: 'channel', // ✅ Forzar tipo en frontend también
          isDM: false
        };
        onChannelCreated(channelWithType);
        onClose();
      } else {
        alert(data.message || "Error al crear el canal");
      }
    } catch (error) {
      console.error("Error al crear canal:", error);
      alert("Error al conectar con el servidor");
    } finally {
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
          <h2>Crear Nuevo Grupo</h2>
          <button className="modal-close" 
            onClick={onClose} aria-label="Cerrar modal">×
          </button>
        </div>

        {/* Formulario para crear canal */}
        <form onSubmit={handleCreate} className="modal-form">
          <div className="form-group">
            <label htmlFor="channel-name" className="form-label">
              Nombre del grupo
            </label>
            <input
              id="channel-name"
              type="text"
              placeholder="Ej: Proyecto Alpha, Amigos, Team Dinamita, etc."
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
              placeholder="Describe el propósito de este Grupo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isCreating}
              rows={3}
            />
          </div>

          {/* ✅ NUEVA SECCIÓN: Configuración de privacidad del canal */}
          <div className="form-group">
            <div className="privacy-settings">
              <h4 className="privacy-title">Configuración de Privacidad</h4>
              
              <div className="privacy-options">
                <label className="privacy-option">
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    checked={isPublic}
                    onChange={() => setIsPublic(true)}
                    disabled={isCreating}
                  />
                  <div className="privacy-content">
                    <span className="privacy-label">🌍 Canal Público</span>
                    <span className="privacy-description">
                      Cualquier usuario puede ver y unirse a este canal
                    </span>
                  </div>
                </label>

                <label className="privacy-option">
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={!isPublic}
                    onChange={() => setIsPublic(false)}
                    disabled={isCreating}
                  />
                  <div className="privacy-content">
                    <span className="privacy-label">🔒 Canal Privado</span>
                    <span className="privacy-description">
                      Solo usuarios invitados pueden unirse a este canal
                    </span>
                  </div>
                </label>
              </div>

              {/* Información adicional según la selección */}
              {isPublic ? (
                <div className="privacy-notice public">
                  <div className="notice-icon">💡</div>
                  <div className="notice-text">
                    <strong>Los canales públicos</strong> son visibles para todos los usuarios 
                    y cualquiera puede unirse libremente.
                  </div>
                </div>
              ) : (
                <div className="privacy-notice private">
                  <div className="notice-icon">🔐</div>
                  <div className="notice-text">
                    <strong>Los canales privados</strong> son invisibles para otros usuarios. 
                    Solo podrán unirse quienes tú invites manualmente.
                  </div>
                </div>
              )}
            </div>
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
                `Crear ${isPublic ? 'Canal Público' : 'Canal Privado'}` // ✅ Texto dinámico según el tipo
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}