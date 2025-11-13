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
<<<<<<< HEAD
  const [isPublic, setIsPublic] = useState(true); // 👈 Nuevo estado
=======
  // Estado para evitar múltiples envíos (doble clic)
>>>>>>> 91a73c119acb938cc36e705ec392a2e9a2f88f18
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
<<<<<<< HEAD
    e.preventDefault();

=======
    e.preventDefault(); // Evita recargar la página al enviar el formulario
    // Si ya se está creando un canal, evita un segundo envío
>>>>>>> 91a73c119acb938cc36e705ec392a2e9a2f88f18
    if (isCreating) return;
    setIsCreating(true);

    try {
<<<<<<< HEAD
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!user?.id) {
=======
      // Obtener el usuario actual (asumimos que está guardado en localStorage)
      const token = localStorage.getItem("token");


      //Verificar si el usuario está autenticado
      if(!token){
>>>>>>> 91a73c119acb938cc36e705ec392a2e9a2f88f18
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

<<<<<<< HEAD
=======
      //Enviar la solicitud al backend
>>>>>>> 91a73c119acb938cc36e705ec392a2e9a2f88f18
      const res = await fetch(`${API_URL}/channels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name,
          description,
<<<<<<< HEAD
          isPublic, // 👈 Se envía al backend
          type: "channel",
=======
          creatorId // Se envía el ID del creador
>>>>>>> 91a73c119acb938cc36e705ec392a2e9a2f88f18
        }),
      });

      const data = await res.json();

      if (res.ok) {
        onChannelCreated(data);
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

<<<<<<< HEAD
=======
  // Manejar teclas del teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  /*===============================================================
  Renderizado del modal
  ===============================================================*/
>>>>>>> 91a73c119acb938cc36e705ec392a2e9a2f88f18
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

<<<<<<< HEAD
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

          {/* 👇 Selector de visibilidad del canal */}
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              Canal público
            </label>
            <small className="text-muted">
              {isPublic
                ? "Cualquiera podrá unirse al canal."
                : "Solo usuarios invitados podrán acceder."}
            </small>
          </div>

          <div className="modal-buttons">
            <button type="submit" className="btn-primary" disabled={isCreating}>
              {isCreating ? "Creando..." : "Crear"}
            </button>

            <button type="button" className="btn-secondary" onClick={onClose}>
=======
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

          {/* Botones del modal */}
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
              disabled={isCreating}
            >
>>>>>>> 91a73c119acb938cc36e705ec392a2e9a2f88f18
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
