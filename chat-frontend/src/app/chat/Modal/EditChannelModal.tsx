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
  const [isLoading, setIsLoading] = useState(false);
const token = localStorage.getItem('token'); // ✅ OBTENER TOKEN
  //Cargar lista de usuarios del canal al abrir el modal
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_URL}/channels/${channel.idChannel}/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
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
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/channels/${channel.idChannel}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
    } finally {
      setIsLoading(false);
    }
  };

  //Agregar un usuario al canal
  const handleAddUser = async () => {
    if (!newUser.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/channels/${channel.idChannel}/add-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/channels/${channel.idChannel}/remove-user/${idUser}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.ok) {
        setUsers(users.filter((u) => u.idUser !== idUser)); //Quitarlo del estado local
      } else {
        const data = await res.json();
        alert(data.message || "No se pudo expulsar usuario");
      }
    } catch (err) {
      console.error("Error al expulsar al usuario:", err);
    } finally {
      setIsLoading(false);
    }
  };

  //Verificar si el usuario actual es el creador del canal
  //(ajustado a channel.creator?.username o createdBy)
  const isCreator = channel.creator?.username === username || channel.createdBy === username;


return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-channel-modal" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <h3>Editar Canal</h3>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-body-content"> {/* ✅ NUEVO CONTENEDOR CON SCROLL */}
            {!isCreator ? (
              <p className="no-access-message">
                Solamente el creador puede modificar este canal.
              </p>
            ) : (
              <form className="modal-form" onSubmit={handleSave}>
                
                <div className="form-group">
                  <label className="form-label">Nombre del Canal</label>
                  <input
                    type="text"
                    placeholder="Ingresa el nombre del canal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Descripción <span className="optional">(Opcional)</span>
                  </label>
                  <textarea
                    placeholder="Describe el propósito del canal"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      disabled={isLoading}
                    />
                    Canal Público
                  </label>
                </div>

                <div className="users-management-section">
                  <h4 className="users-section-title">Usuarios en el canal</h4>
                  
                  <div className="users-list-container">
                    {users.length > 0 ? (
                      users.map((u) => (
                        <div key={u.idUser} className="user-list-item">
                          <span className="user-username">{u.username}</span>
                          {u.username !== username && (
                            <button 
                              className="kick-user-btn"
                              onClick={() => handleKickUser(u.idUser)}
                              disabled={isLoading}
                              title="Expulsar usuario"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="no-users-message">
                        No hay usuarios en este canal
                      </p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Agregar Usuario</label>
                    <div className="add-user-input-group">
                      <input
                        type="text"
                        placeholder="Nombre de usuario"
                        value={newUser}
                        onChange={(e) => setNewUser(e.target.value)}
                        disabled={isLoading}
                        className="add-user-input"
                      />
                      <button 
                        className="btn-primary add-user-btn"
                        onClick={handleAddUser}
                        disabled={isLoading || !newUser.trim()}
                        type="button"
                      >
                        ➕ Agregar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="loading-spinner"></span>
                        Guardando...
                      </>
                    ) : (
                      'Guardar Cambios'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div> 
        </div>
      </div>
    </div>
  );
}