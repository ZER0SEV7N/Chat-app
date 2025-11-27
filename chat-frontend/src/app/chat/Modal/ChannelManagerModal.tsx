//src/app/chat/Modal/ChannelManageModal.tsx
//Modal para crear canales públicos/privados y unirse a canales públicos.
//Maneja REST + WebSocket indirectly (solo usa socketContext para mantener contexto).
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import "./modal.css"; 
import "./modal-responsive.css";
import { useSocket } from "@/lib/socketContext"; 
import { API_URL } from "@/lib/config";

//Definir las propiedades del modal
interface ChannelManagerModalProps {
  onClose: () => void;
  onChannelCreated: (channel: any) => void;
  onChannelJoined: (channel: any) => void;
}

//Componente del modal
interface PublicChannels {
    idChannel: number;
    name: string;
    description: string;
    isPublic: boolean;
    creator: {
        idUser: number;
        username: string;
    };
    membersCount: number;
    isMember: boolean; //Indica si el usuario ya forma parte
}

//Componente del modal
export default function ChannelManagerModal({
  onClose,
  onChannelCreated,
  onChannelJoined,
}: ChannelManagerModalProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const { socket } = useSocket(); 
    
  //Estados para la pestaña de Crear
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  //Estados para la pestaña de Unirse
  const [searchTerm, setSearchTerm] = useState("");
  const [publicChannels, setPublicChannels] = useState<PublicChannels[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<PublicChannels[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [joiningChannelId, setJoiningChannelId] = useState<number | null>(null);

  /*===============================================================
    Obtiene los canales públicos desde el backend (GET /channels/public)
  ===============================================================*/
  const fetchPublicChannels = async () => {
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/channels/public`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) throw new Error("Error al cargar canales");

      const channels = await res.json();
      setPublicChannels(channels);
      setFilteredChannels(channels);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los grupos públicos");
    }

    setIsLoading(false);
  };

  //Carga automáticamente los canales cuando la pestaña "join" se abre
  useEffect(() => {
    if (activeTab === "join") fetchPublicChannels();
  }, [activeTab]);

  /*===============================================================
    Filtro de búsqueda en canales públicos
  ===============================================================*/
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredChannels(publicChannels);
    } else {
      const filtered = publicChannels.filter((c) =>
        (c.name + c.description).toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredChannels(filtered);
    }
  }, [searchTerm, publicChannels]);

  /*===============================================================
    Crear canal vía REST (POST /channels/create)
  ===============================================================*/
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;

    setIsCreating(true);

    try {
      const res = await fetch(`${API_URL}/channels/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          isPublic,
          type: "channel",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error creando el canal");

      // Notificar al usuario
      toast.success(
        `Canal ${isPublic ? "público" : "privado"} "${data.name}" creado`
      );

      // Informar al componente padre
      onChannelCreated({
        ...data,
        type: "channel",
        isDM: false,
      });

      onClose();
    } catch (err: any) {
      toast.error(err.message);
    }

    setIsCreating(false);
  };

  /*===============================================================
    Unirse a canal vía REST (POST /channels/:id/join)
  ===============================================================*/
  const handleJoinChannel = async (idChannel: number) => {
    setJoiningChannelId(idChannel);

    try {
      const res = await fetch(`${API_URL}/channels/${idChannel}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(`Te has unido al grupo "${data.name}"`);

      onChannelJoined(data);
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    }

    setJoiningChannelId(null);
  };

  /*===============================================================
    Resetea formulario de creación cuando se cambia de pestaña
  ===============================================================*/
  const resetForm = () => {
    setName("");
    setDescription("");
    setIsPublic(true);
  };

  useEffect(() => {
    if (activeTab === "create") resetForm();
  }, [activeTab]);

  // Cierra el modal al presionar ESC
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  /*===============================================================
  RENDERIZADO DEL MODAL
  ===============================================================*/
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        tabIndex={0} //Hacer el modal focusable para eventos de teclado
      >
        {/* Header del modal */}
        <div className="modal-header">
          <h2>Gestión de Grupos</h2>
          <button 
            className="modal-close" 
            onClick={onClose} 
            aria-label="Cerrar modal"
            disabled={isCreating} //Deshabilitar mientras se crea
          >
            ×
          </button>
        </div>

        {/* Pestañas internas */}
        <div className="modal-tabs">
          <button 
            className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
            disabled={isCreating} //Deshabilitar mientras se crea
          >
            ➕ Crear Grupo
          </button>
          <button 
            className={`tab-button ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
            disabled={isLoading} //Deshabilitar mientras carga
          >
            🔍 Unirse a Grupo
          </button>
        </div>

        <div className="modal-body">
          {/* Pestaña: Crear Grupo */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateChannel} className="modal-form">
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
                  maxLength={50} //Limitar longitud
                />
                <div className="character-count">
                  {name.length}/50 caracteres
                </div>
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
                  maxLength={200} //Limitar longitud
                />
                <div className="character-count">
                  {description.length}/200 caracteres
                </div>
              </div>

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
                </div>
              </div>

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
                    `Crear ${isPublic ? 'Canal Público' : 'Canal Privado'}`
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Pestaña: Unirse a Grupo */}
          {activeTab === 'join' && (
            <div className="join-tab-content">
              {/* Barra de búsqueda */}
              <div className="form-group">
                <label htmlFor="channel-search" className="form-label">
                  🔍 Buscar grupos públicos
                </label>
                <input
                  id="channel-search"
                  type="text"
                  placeholder="Escribe el nombre de un grupo para buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
                {searchTerm && (
                  <div className="search-results-info">
                    {filteredChannels.length} canal(es) encontrado(s)
                  </div>
                )}
              </div>

              {/* Lista de canales públicos */}
              <div className="public-channels-list">
                {isLoading ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Cargando grupos públicos...</p>
                  </div>
                ) : filteredChannels.length === 0 ? (
                  <div className="empty-state">
                    <p>
                      {searchTerm 
                        ? "No se encontraron grupos que coincidan con tu búsqueda" 
                        : "No hay grupos públicos disponibles en este momento"
                      }
                    </p>
                    {!searchTerm && (
                      <button 
                        className="btn-secondary"
                        onClick={() => setActiveTab('create')}
                      >
                        🎯 Crear el primer canal
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="channels-grid">
                    {filteredChannels.map((channel) => (
                      <div key={channel.idChannel} className="channel-card">
                        <div className="channel-card-header">
                          <h3 className="channel-name">#{channel.name}</h3>
                        </div>
                        
                        <p className="channel-description">
                          {channel.description || "Sin descripción"}
                        </p>
                        
                        <div className="channel-card-footer">
                          <div className="channel-creator">
                            Creado por: <strong>@{channel.creator.username}</strong>
                          </div>
                          
                          <button
                            className={`join-btn ${channel.isMember ? 'joined' : ''}`}
                            onClick={() => handleJoinChannel(channel.idChannel)}
                            disabled={channel.isMember || joiningChannelId === channel.idChannel}
                          >
                            {joiningChannelId === channel.idChannel ? (
                              <>
                                <div className="button-spinner"></div>
                                Uniendo...
                              </>
                            ) : channel.isMember ? (
                              <>
                                ✅ Ya eres miembro
                              </>
                            ) : (
                              "➕ Unirse al grupo"
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={onClose}
                  disabled={isLoading || joiningChannelId !== null}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}