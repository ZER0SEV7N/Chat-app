/*src/app/chat/Modal/EditChannelModal.tsx
Módulo para editar canales desde el frontend
───────────────────────────────────────────────*/
import React, { useEffect, useState } from "react";
import "./modal.css"; // Estilos del modal
import "./modal-responsive.css";
import { API_URL } from "@/lib/config"; // URL base del backend
import toast from "react-hot-toast";

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
  const [members, setMembers] = useState<any[]>([]); //Usuarios que pertenecen al canal
  const [availableUsers, setAvailableUsers] = useState<any[]>([]); //Todos los usuarios disponibles
  const [newUser, setNewUser] = useState(""); //Usuario a agregar
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'members'>('settings');
  const token = localStorage.getItem('token'); //OBTENER TOKEN
  //Cargar lista de usuarios del canal al abrir el modal
  useEffect(() => {
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      //Usar el endpoint que devuelve la estructura correcta
        const manageUsersRes = await fetch(`${API_URL}/channels/${channel.idChannel}/manage-users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (manageUsersRes.ok) {
          const manageData = await manageUsersRes.json();
          console.log('🔍 DEBUG - Datos de gestión de usuarios:', manageData);
          
          //La estructura es { channel, currentMembers, availableUsers, isPublic }
          const currentMembers = manageData.currentMembers || [];
          const availableUsers = manageData.availableUsers || [];
          
          setMembers(currentMembers);
          setAvailableUsers(availableUsers);
          
          console.log('✅ Usuarios cargados:', {
            miembros: currentMembers.length,
            disponibles: availableUsers.length
          });
        } else {
          console.error('Error al cargar usuarios del canal');
        }
      } catch (err) {
        console.error("Error al obtener los datos del usuario:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (channel?.idChannel) {
      fetchUsers();
    }
  }, [channel.idChannel, token]); 

  //Guardar los cambios del canal (nombre, descripción, visibilidad)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    //Validar que el canal tenga un id válido
    if (!channel?.idChannel) {
      toast.error("Canal inválido o sin identificador.");
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
        toast.error(data.message || "Error al actualizar el canal");
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

    //Verificar que el usuario existe en la lista de disponibles
    const userToAdd = availableUsers.find(u => u.username === newUser);
    if (!userToAdd) {
      toast.error("Usuario no encontrado o ya pertenece al canal");
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/channels/${channel.idChannel}/add-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: newUser }),
      });

      const data = await res.json();

      if (res.ok) {
        //El backend devuelve el CANAL completo, no el usuario
        console.log('🔍 DEBUG - Canal actualizado:', data);
        
        //El backend devuelve el canal con todos los miembros
        //Usamos el userToAdd que ya tenemos para actualizar la UI
        setMembers(prev => [...prev, userToAdd]);
        setAvailableUsers(prev => prev.filter(u => u.idUser !== userToAdd.idUser));
        setNewUser("");
        
        //Usar el usuario que conocemos de availableUsers
        toast.error(`${userToAdd.name || userToAdd.username} agregado correctamente`);
      } else {
        toast.error(data.message || "Error al agregar usuario al canal");
      }
    } catch (err) {
      console.error("Error al agregar usuario:", err);
      toast.error("Error de conexión al agregar usuario");
    } finally {
      setIsLoading(false);
    }
  };

  //Función específica para agregar desde sugerencias
  const handleAddUserFromSuggestion = async (username: string) => {
    //Buscar en ambas listas para encontrar el usuario
    let userToAdd = filteredAvailableUsers.find(u => u.username === username);
    if (!userToAdd) {
      userToAdd = availableUsers.find(u => u.username === username);
    }
    
    if (!userToAdd) {
      toast.error("Usuario no encontrado");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/channels/${channel.idChannel}/add-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: userToAdd.username }),
      });

      const data = await res.json();

      if (res.ok) {
        //Usar userToAdd que encontramos correctamente
        setMembers(prev => [...prev, userToAdd]);
        setAvailableUsers(prev => prev.filter(u => u.idUser !== userToAdd.idUser));
        setNewUser("");
        
        toast.success(`${userToAdd.name || userToAdd.username} agregado correctamente`);
      } else {
        toast.error(data.message || "Error al agregar usuario al canal");
      }
    } catch (err) {
      console.error("Error al agregar usuario:", err);
      toast.error("Error de conexión al agregar usuario");
    } finally {
      setIsLoading(false);
    }
  };

  //Expulsar (kickear) un usuario del canal
  const handleKickUser = async (userId: number, username: string) => {
    if (!confirm(`¿Expulsar a ${username} del canal?`)) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/channels/${channel.idChannel}/remove-user/${userId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.ok) {
        const removedUser = members.find(m => m.idUser === userId);
        setMembers(prev => prev.filter(m => m.idUser !== userId));//Quitarlo del estado local
      } else {
        const data = await res.json();
        toast.error(data.message || "No se pudo expulsar usuario");
      }
    } catch (err) {
      console.error("Error al expulsar al usuario:", err);
      toast.error("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  //Verificar si el usuario actual es el creador del canal
  //(ajustado a channel.creator?.username o createdBy)
  const isCreator = channel.creator?.username === username || channel.createdBy === username;

  //Obtener usuarios disponibles para agregar (no miembros actuales)
  const filteredAvailableUsers = availableUsers.filter(user => 
    user.username.toLowerCase().includes(newUser.toLowerCase()) ||
    user.name.toLowerCase().includes(newUser.toLowerCase())
  );

    // Cierra el modal al presionar ESC
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
  

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-channel-modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        
        {/* Header */}
        <div className="modal-header">
          <div className="header-content">
            <h3>Configuración del Canal</h3>
            <p className="channel-subtitle">#{channel.name}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        {/* Navegación por pestañas */}
        <div className="modal-tabs">
          <button 
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Configuración
          </button>
          <button 
            className={`tab-button ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            👥 Miembros ({members.length})
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-body-content">
            {!isCreator ? (
              <div className="access-denied">
                <div className="denied-icon">🔒</div>
                <h4>Acceso Restringido</h4>
                <p>Solamente el creador del canal puede modificar la configuración.</p>
                <button className="btn-secondary" onClick={onClose}>
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                {/* Pestaña de Configuración */}
                {activeTab === 'settings' && (
                  <form className="modal-form" onSubmit={handleSave}>
                    <div className="form-section">
                      <h4 className="section-title">Información del Canal</h4>
                      
                      <div className="form-group">
                        <label className="form-label">
                          📝 Nombre del Canal
                          <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Desarrollo Frontend"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          disabled={isLoading}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          📄 Descripción
                          <span className="optional">(Opcional)</span>
                        </label>
                        <textarea
                          placeholder="Describe el propósito de este canal..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          disabled={isLoading}
                          className="form-textarea"
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="form-section">
                      <h4 className="section-title">Configuración de Acceso</h4>
                      
                      <div className="privacy-setting">
                        <div className="privacy-option">
                          <label className="checkbox-label large">
                            <input
                              type="checkbox"
                              checked={isPublic}
                              onChange={(e) => setIsPublic(e.target.checked)}
                              disabled={isLoading}
                            />
                            <div className="checkbox-content">
                              <span className="privacy-title">🌍 Canal Público</span>
                              <span className="privacy-description">
                                Cualquier usuario puede ver y unirse a este canal
                              </span>
                            </div>
                          </label>
                        </div>
                        
                        {isPublic && (
                          <div className="privacy-notice">
                            <div className="notice-icon">💡</div>
                            <div className="notice-text">
                              <strong>Los canales públicos</strong> son visibles para todos 
                              y los usuarios pueden unirse libremente.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="danger-zone">

                      {/* Título de sección */}
                      <h4 className="danger-title">Zona de peligro</h4>

                      {/* Descripción */}
                      <p className="danger-description">
                        Esta acción eliminará el canal permanentemente para todos los miembros.
                        No se puede deshacer.
                      </p>

                      {/* Botón principal de eliminar canal */}
                      <button
                        type="button"
                        className="btn-danger delete-button"
                        disabled={isLoading}
                        onClick={async () => {

                          // Confirmación al usuario para evitar eliminaciones accidentales
                          if (!confirm(`¿Eliminar el canal "${channel.name}" permanentemente?`)) return;

                          setIsLoading(true);

                          try {
                            //Llamada al backend para eliminar el canal
                            const res = await fetch(`${API_URL}/channels/${channel.idChannel}`, {
                              method: "DELETE",
                              headers: { Authorization: `Bearer ${token}` }
                            });

                            //Si eliminación correcta
                            if (res.ok) {
                              onClose(); //Cerrar modal

                              //Avisar al padre para remover el canal de la lista visual
                              onChannelUpdate({
                                deleted: true,
                                idChannel: channel.idChannel
                              });

                            } else {
                              const data = await res.json();
                              toast.error(data.message || "No se pudo eliminar el canal");
                            }
                          } catch (err) {
                            console.error("Error al eliminar canal:", err);
                            toast.error("Error de conexión al intentar eliminar el canal.");
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                      >
                        🗑️ Eliminar canal
                      </button>
                    </div>

                    <div className="form-actions">
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
                        className="btn-primary save-button"
                        disabled={isLoading || !name.trim()}
                      >
                        {isLoading ? (
                          <>
                            <div className="button-spinner"></div>
                            Guardando...
                          </>
                        ) : (
                          '💾 Guardar Cambios'
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Pestaña de Miembros */}
                {activeTab === 'members' && (
                  <div className="members-tab">
                    <div className="members-header">
                      <h4 className="section-title">
                        {isPublic ? "Miembros del Canal" : "Gestión de Miembros"}
                      </h4>
                      <div className="members-count">
                        {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
                      </div>
                    </div>

                    {/* Lista de miembros */}
                    <div className="members-list">
                      {members.map((user) => (
                        <div key={user.idUser} className="member-item">
                          <div className="member-info">
                            <div className="member-avatar">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="member-details">
                              <span className="member-name">{user.name}</span>
                              <span className="member-username">@{user.username}</span>
                            </div>
                          </div>
                          <div className="member-actions">
                            {user.idUser === channel.creator?.idUser && (
                              <span className="creator-tag">Creador</span>
                            )}
                            {user.idUser !== idUser && user.idUser !== channel.creator?.idUser && (
                              <button
                                className="remove-button"
                                onClick={() => handleKickUser(user.idUser, user.username)}
                                disabled={isLoading}
                                title="Expulsar del canal"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                  {/* Agregar usuarios*/}
                    <div className="add-members-section">
                      <h5 className="subsection-title">Agregar Miembros</h5>
                      <div className="add-member-form">
                        <div className="search-container">
                          <input
                            type="text"
                            placeholder="Buscar usuario por nombre o username..."
                            value={newUser}
                            onChange={(e) => setNewUser(e.target.value)}
                            disabled={isLoading}
                            className="search-input"
                          />
                          <button 
                            className="btn-primary add-button"
                            onClick={handleAddUser}
                            disabled={isLoading || !newUser.trim()}
                          >
                            {isLoading ? "..." : "➕ Agregar"}
                          </button>
                        </div>
                        
                        {/* Sugerencias de usuarios */}
                        {newUser && filteredAvailableUsers.length > 0 && (
                        <div className="user-suggestions">
                          {filteredAvailableUsers.slice(0, 5).map(user => (
                            <div 
                              key={`suggestion-${user.idUser}`}
                              className="suggestion-item"
                              onClick={() => handleAddUserFromSuggestion(user.username)} // ✅ CORREGIDO: Llamar directamente
                            >
                              <div className="suggestion-avatar">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="suggestion-details">
                                <span className="suggestion-name">{user.name}</span>
                                <span className="suggestion-username">@{user.username}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      </div>
                      
                      {availableUsers.length > 0 && (
                        <div className="available-count">
                          {availableUsers.length} usuarios disponibles para agregar
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}