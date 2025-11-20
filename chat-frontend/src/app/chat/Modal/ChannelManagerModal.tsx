//src/app/chat/Modal/ChannelManageModal.tsx
//Modal para unirse a un canal público
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import "./modal.css";
import "./modal-dark.css";
import "./modal-responsive.css";
import { useSocket } from "@/lib/socketContext"; // ✅ IMPORTAR SOCKET CONTEXT

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
    isMember: boolean;
}

//Componente del modal
export default function ChannelManagerModal({
  onClose,
  onChannelCreated,
  onChannelJoined,
}: ChannelManagerModalProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const { socket } = useSocket(); // ✅ OBTENER SOCKET DEL CONTEXTO
    
  // Estados para la pestaña de Crear
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Estados para la pestaña de Unirse
  const [searchTerm, setSearchTerm] = useState("");
  const [publicChannels, setPublicChannels] = useState<PublicChannels[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<PublicChannels[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [joiningChannelId, setJoiningChannelId] = useState<number | null>(null);

    //=====================================
    // EFECTOS Y LISTENERS DE WEBSOCKET
    //======================================
    
    // ✅ ESCUCHAR EVENTOS DE WEBSOCKET AL MONTAR EL COMPONENTE
    useEffect(() => {
      if (!socket) return;

      // 🔔 Listener para recibir lista de canales públicos
      const handlePublicChannels = (channels: PublicChannels[]) => {
        console.log("📥 Canales públicos recibidos:", channels);
        setPublicChannels(channels);
        setFilteredChannels(channels);
        setIsLoading(false);
      };

      // ✅ Listener para confirmación de creación de canal
      const handleChannelCreated = (channel: any) => {
        console.log("✅ Canal creado recibido:", channel);
        setIsCreating(false);
        
        // Mostrar confirmación mejorada
        if (channel.isPublic) {
          toast.success(`✅ Canal público "${channel.name}" creado exitosamente.\n\n👥 Todos los usuarios tienen acceso automático.`);
        } else {
          toast.success(`✅ Canal privado "${channel.name}" creado exitosamente.\n\n🔒 Solo usuarios invitados podrán unirse.`);
        }

        // Asegurar que el canal tenga el tipo correcto
        const channelWithType = {
          ...channel,
          type: 'channel',
          isDM: false
        };

        onChannelCreated(channelWithType);
        onClose();
      };

      // ✅ Listener para confirmación de unión a canal
      const handleChannelJoined = (channel: any) => {
        console.log("✅ Unión a canal confirmada:", channel);
        setJoiningChannelId(null);
        
        toast.success(`✅ Te has unido al canal "${channel.name}"`);
        onChannelJoined(channel);
        onClose();
      };

      // ❌ Listener para errores
      const handleError = (error: { message: string }) => {
        console.error("❌ Error recibido:", error);
        setIsCreating(false);
        setJoiningChannelId(null);
        toast.error(error.message || "Error en la operación");
      };

      // 📡 Registrar listeners
      socket.on('publicChannels', handlePublicChannels);
      socket.on('channelCreated', handleChannelCreated);
      socket.on('channelJoined', handleChannelJoined);
      socket.on('error', handleError);

      // 🧹 Limpiar listeners al desmontar
      return () => {
        socket.off('publicChannels', handlePublicChannels);
        socket.off('channelCreated', handleChannelCreated);
        socket.off('channelJoined', handleChannelJoined);
        socket.off('error', handleError);
      };
    }, [socket, onChannelCreated, onChannelJoined, onClose]);

    //=====================================
    // CARGA DE CANALES PÚBLICOS
    //======================================
    
    //Cargar canales Publicos al cambiar a pestaña "Unirse"
    useEffect(() => {
      if (activeTab === 'join' && socket) {
        fetchPublicChannels();
      }
    }, [activeTab, socket]);

    //Filtrar canales segun la busqueda
    useEffect(() => {
        if(searchTerm.trim() === "") {
            setFilteredChannels(publicChannels);
        } else {
            const filtered = publicChannels.filter(channel =>
                channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                channel.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredChannels(filtered);
        }
    }, [searchTerm, publicChannels]);

    //=====================================
    // FUNCIONES PRINCIPALES
    //======================================

    // ✅ FUNCIÓN ACTUALIZADA: Cargar canales públicos via WebSocket
    const fetchPublicChannels = async () => {
        setIsLoading(true);
        try {
            if (!socket) {
                toast.error("Error: Conexión no disponible");
                return;
            }
            
            console.log("📡 Solicitando canales públicos via WebSocket...");
            // 📡 Enviar evento WebSocket en lugar de HTTP
            socket.emit('getPublicChannels');
            
        } catch (error) {
            console.error("Error fetching public channels:", error);
            toast.error("Error al cargar los canales públicos");
            setIsLoading(false);
        }
        // ❗ NO llamar setIsLoading(false) aquí - se llamará cuando llegue la respuesta
    };

    // ✅ FUNCIÓN ACTUALIZADA: Unirse a canal público via WebSocket
    const handleJoinChannel = async (channelId: number) => {
        if (!socket) {
            toast.error("Error: Conexión no disponible");
            return;
        }

        setJoiningChannelId(channelId);
        console.log(`📡 Uniéndose al canal ${channelId} via WebSocket...`);
        
        // 📡 Enviar evento WebSocket en lugar de HTTP
        socket.emit('joinPublicChannel', channelId);
        
        // ❗ NO hacer setJoiningChannelId(null) aquí - se hará cuando llegue la respuesta
    };

    // ✅ FUNCIÓN ACTUALIZADA: Crear canal via WebSocket
    const handleCreateChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isCreating || !socket) return;
        
        setIsCreating(true);
        console.log("📡 Creando canal via WebSocket...", {
            name,
            description,
            isPublic
        });

        // 📡 Enviar evento WebSocket en lugar de HTTP
        socket.emit('createChannel', {
            name: name.trim(),
            description: description.trim(),
            isPublic,
            autoAddAllUsers: false
        });
        
        // ❗ NO hacer setIsCreating(false) aquí - se hará cuando llegue la respuesta
    };

    //=====================================
    // FUNCIONES AUXILIARES
    //======================================

    //Función para salir al presionar escape
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            onClose();
        }
    };

    // ✅ FUNCIÓN PARA LIMPIAR FORMULARIOS
    const resetForm = () => {
        setName("");
        setDescription("");
        setIsPublic(true);
    };

    // ✅ ACTUALIZAR FORMULARIOS AL CAMBIAR PESTAÑA
    useEffect(() => {
        if (activeTab === 'create') {
            resetForm();
        }
    }, [activeTab]);

  /*===============================================================
  RENDERIZADO DEL MODAL
  ===============================================================*/
 return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        tabIndex={0} // ✅ Hacer el modal focusable para eventos de teclado
      >
        {/* Header del modal */}
        <div className="modal-header">
          <h2>Gestión de Grupos</h2>
          <button 
            className="modal-close" 
            onClick={onClose} 
            aria-label="Cerrar modal"
            disabled={isCreating} // ✅ Deshabilitar mientras se crea
          >
            ×
          </button>
        </div>

        {/* Pestañas internas */}
        <div className="modal-tabs">
          <button 
            className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
            disabled={isCreating} // ✅ Deshabilitar mientras se crea
          >
            ➕ Crear Grupo
          </button>
          <button 
            className={`tab-button ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
            disabled={isLoading} // ✅ Deshabilitar mientras carga
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
                  maxLength={50} // ✅ Limitar longitud
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
                  maxLength={200} // ✅ Limitar longitud
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