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

  /*===============================================================
  Renderizado del modal
  ===============================================================*/
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Nuevo Canal</h2>

        {/* Formulario para crear canal */}
        <form onSubmit={handleCreate}>
          {/* Campo para el nombre del canal */}
          <input
            type="text"
            placeholder="Nombre del canal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {/* Campo para la descripción (opcional) */}
          <textarea
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Botones del modal */}
          <div className="modal-buttons">
            <button type="submit" className="btn-primary" disabled={isCreating}>
              {isCreating ? "Creando..." : "Crear"}
            </button>

            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}