/*src/app/chat/Modal/EditChannelModal.tsx
Módulo para editar canales desde el frontend
───────────────────────────────────────────────*/

import React, { useEffect, useState } from "react";
import "./modal.css"; // Estilos del modal
import { API_URL } from "@/lib/config"; // URL base del backend

//Interfaz de propiedades que recibe el modal
interface EditChannelModalProps {
  channel: any; //Canal actual seleccionado
  onClose: () => void; //Función para cerrar el modal
  onChannelUpdate: (updated: any) => void; //Callback al guardar cambios
  username: string; //Usuario actual (para verificar permisos)
  idUser: number; //ID del usuario actual (para enviarlo al backend)
}

//Componente principal
export default function EditChannelModal({
  channel,
  onClose,
  onChannelUpdate,
  username,
  idUser,
}: EditChannelModalProps) {
  //Estados locales del formulario
  const [name, setName] = useState(channel.name || "");
  const [description, setDescription] = useState(channel.description || "");
  const [isPublic, setIsPublic] = useState(channel.isPublic);
  const [users, setUsers] = useState<any[]>([]); //Usuarios que pertenecen al canal
  const [newUser, setNewUser] = useState(""); //Usuario a agregar

  //Cargar lista de usuarios del canal al abrir el modal
  useEffect(() => { 
    const fetchUsers = async () => { 
      try{
        const res = await fetch(`${API_URL}/channels/${channel.idChannel}/users`);
        const data = await res.json();

        if (res.ok) setUsers(data);
        else console.error("Error al cargar usuarios del canal:", data);
      }catch(err) {
        console.error("Error al obtener los datos del usuario:", err);
      }
    };
    if(channel?.idChannel) fetchUsers();
  }, [channel.idChannel]);

  //Guardar los cambios del canal (nombre, descripción, visibilidad)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    //Validar que el canal tenga un id válido
    if (!channel?.idChannel) {
      alert("Canal inválido o sin identificador.");
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/channels/${channel.idChannel}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        //Se envía también el idUser para mantener al creador
        body: JSON.stringify({
          name,
          description,
          isPublic,
          idUser, //Se mantiene la propiedad del creador aunque cambie visibilidad
        }),
      });

      const data = await res.json();

      if (res.ok) {
        onChannelUpdate(data); //Notificar al componente padre del cambio
        onClose(); //Cerrar modal
      } else {
        alert(data.message || "Error al actualizar el canal");
      }
    } catch (err) {
      console.error("Error al actualizar canal:", err);
    }
  };

  //Agregar un usuario al canal
  const handleAddUser = async () => {
    if (!newUser.trim()) return;
    try {
      const res = await fetch(`${API_URL}/channels/${channel.idChannel}/add-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUser }),
      });

      const data = await res.json();

      if (res.ok) {
        setUsers((prev) => [...prev, data]); //Añadir el nuevo usuario a la lista local
        setNewUser("");
      } else {
        alert(data.message || "Error al agregar usuario al canal");
      }
    } catch (err) {
      console.error("Error al agregar usuario:", err);
    }
  };

  //Expulsar (kickear) un usuario del canal
  const handleKickUser = async (idUser: number) => {
    const confirmKick = confirm("¿Deseas expulsar este usuario del canal?");
    if (!confirmKick) return;

    try {
      const res = await fetch(
        `${API_URL}/channels/${channel.idChannel}/remove-user/${idUser}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setUsers(users.filter((u) => u.idUser !== idUser)); //Quitarlo del estado local
      } else {
        const data = await res.json();
        alert(data.message || "No se pudo expulsar usuario");
      }
    } catch (err) {
      console.error("Error al expulsar al usuario:", err);
    }
  };

  //Verificar si el usuario actual es el creador del canal
  //(ajustado a channel.creator?.username o createdBy)
  const isCreator =
    channel.creator?.username === username || channel.createdBy === username;

  //Renderizado del modal
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Editar Canal</h2>

        {/* ⚠️ Si no es creador, mostrar aviso y bloquear edición */}
        {!isCreator ? (
          <p className="no-access-msg">
            Solamente el creador puede modificar este canal.
          </p>
        ) : (
          /* 📝 Formulario de edición de canal */
          <form onSubmit={handleSave}>
            <input
              type="text"
              placeholder="Nombre del Canal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <textarea
              placeholder="Descripción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <label className="checkbox">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              Público
            </label>

            {/* Botones de acción */}
            <div className="modal-buttons">
              <button type="submit" className="btn-submit">
                Guardar
              </button>
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* 👥 Gestión de usuarios (solo si es creador) */}
        {isCreator && (
          <>
            <h3>Usuarios en el canal</h3>
            <ul className="user-list">
              {users.map((u) => (
                <li key={u.idUser}>
                  {u.username}
                  {/* El creador no puede kickearse a sí mismo */}
                  {u.username !== username && (
                    <button className="kick-btn" onClick={() => handleKickUser(u.idUser)}>
                      ❌
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {/* Sección para agregar nuevos usuarios */}
            <div className="add-user-section">
              <input
                type="text"
                placeholder="Usuario a agregar"
                value={newUser}
                onChange={(e) => setNewUser(e.target.value)}
              />
              <button className="btn-primary" onClick={handleAddUser}>
                ➕ Agregar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
