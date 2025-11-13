import React, { useState } from "react";
import "./modal.css";
import { API_URL } from "@/lib/config";

interface CreateChannelModalProps {
  onClose: () => void;
  onChannelCreated: (channel: any) => void;
}

export default function CreateChannelModal({
  onClose,
  onChannelCreated,
}: CreateChannelModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true); // 👈 Nuevo estado
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isCreating) return;
    setIsCreating(true);

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!user?.id) {
        alert("Error: usuario no autenticado");
        return;
      }

      const res = await fetch(`${API_URL}/channels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name,
          description,
          isPublic, // 👈 Se envía al backend
          type: "channel",
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
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
