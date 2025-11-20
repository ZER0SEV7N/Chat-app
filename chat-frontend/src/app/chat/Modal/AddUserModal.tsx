//src/app/chat/Modal/AddUserModal.tsx
//Modal para agregar un usuario a un canal o iniciar un chat privado
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './modal.css';
import { API_URL } from '@/lib/config';

// Interfaz de propiedades que recibe el modal
interface AddUserModalProps {
  onClose: () => void;
  onChannelCreated: (channel: any) => void;
  onChannelSelected: (channel: any) => void; // Para seleccionar canal existente
  channels: any[];
}

// Interfaz para el usuario obtenido del backend
interface User {
  idUser: number;
  username: string;
  name: string;
  email: string;
}

// Componente principal
export default function AddUserModal({ onClose, onChannelCreated, channels, onChannelSelected }: AddUserModalProps) {
  // Estados del componente
  const [username, setUsername] = useState(''); // Para búsqueda manual
  const [isLoading, setIsLoading] = useState(false); // Estado de carga general
  const [allUsers, setAllUsers] = useState<User[]>([]); // Todos los usuarios del sistema
  const [usersLoading, setUsersLoading] = useState(true); // Estado de carga de usuarios
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda
  const [creatingUser, setCreatingUser] = useState<string | null>(null); // Usuario que se está creando

  // Obtener el usuario actual del localStorage
  const currentUser = localStorage.getItem('username');

  /**
   * Función para encontrar un DM existente entre el usuario actual y el usuario objetivo
   * @param targetUsername - Usuario con el que se quiere chatear
   * @returns El canal DM existente o null si no existe
   */
  const findExistingDM = (targetUsername: string): any | null => {
    const currentUser = localStorage.getItem('username');
    if (!currentUser || !targetUsername) return null;
    
    return channels.find(ch => {
      // Solo buscar en canales no públicos (DMs)
      if (!ch || ch.type !== 'dm') return false;
      
      console.log('🔍 Verificando canal:', ch.name, 'para usuario actual:', currentUser, 'y target:', targetUsername);
      
      // Verificar por targetUsername si existe esta propiedad
      if (ch.targetUsername && ch.targetUsername === targetUsername) {
        console.log('✅ Encontrado por targetUsername');
        return true;
      }
      
      // Verificar por nombre del canal - DEBE INCLUIR AL USUARIO ACTUAL
      if (ch.name && typeof ch.name === 'string' && ch.name.startsWith('DM ')) {
        const cleanName = ch.name.replace('DM ', '');
        const usernames = cleanName.split('-');
        
        // VERIFICACIÓN CRÍTICA: El DM debe contener AL USUARIO ACTUAL Y al target
        const hasCurrentUser = usernames.includes(currentUser);
        const hasTargetUser = usernames.includes(targetUsername);
        
        if (hasCurrentUser && hasTargetUser) {
          console.log('✅ Encontrado DM válido que incluye al usuario actual');
          return true;
        } else if (hasTargetUser && !hasCurrentUser) {
          console.log('❌ DM encontrado pero NO incluye al usuario actual - IGNORAR');
          return false;
        }
      }
      
      return false;
    });
  };

  /**
   * Efecto para cargar todos los usuarios del sistema al montar el componente
   */
  useEffect(() => {
    const fetchAllUsers = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        const res = await fetch(`${API_URL}/chat/users`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (res.ok) {
          const users = await res.json();
          setAllUsers(users);
        } else {
          console.error('Error al cargar usuarios');
        }
      } catch (error) {
        console.error('Error de conexión al cargar usuarios', error);
      } finally {
        setUsersLoading(false);
      }
    };

    // Cargar usuarios al montar el componente
    fetchAllUsers();
  }, []);

  /**
   * Función principal para manejar la creación o selección de un DM
   * @param selectedUsername - Usuario seleccionado (opcional para búsqueda manual)
   */
  const handleAdd = async (selectedUsername?: string) => {
    const userToAdd = selectedUsername || username;
    
    // Validaciones básicas
    if (!userToAdd.trim()) {
      toast.error('Por favor ingresa un nombre de usuario');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Debes iniciar sesión");
      return;
    }

    // VERIFICACIÓN: Buscar DM existente que incluya al usuario actual
    const existingDM = findExistingDM(userToAdd);
    if (existingDM) {
      console.log('🔍 DM existente encontrado que incluye al usuario actual:', existingDM);
      // Si existe, redirigir al DM existente
      onChannelSelected(existingDM);
      onClose();
      return;
    }

    console.log('🆕 Creando NUEVO DM con:', userToAdd);
    setIsLoading(true);
    setCreatingUser(userToAdd);

    try {
      // Llamada al API para crear el DM
      const res = await fetch(`${API_URL}/chat/private`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUsername: userToAdd }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('📨 Respuesta del backend:', data);
        
        // El backend devuelve {channel: {...}, displayName: '...'}
        if (data && data.channel) {
          onChannelCreated(data.channel);
        } else {
          console.error('❌ Estructura inesperada:', data);
          toast.error('Error: Respuesta inesperada del servidor');
        }
      } else {
        const errorText = await res.text();
        console.error('Error del servidor:', errorText);
        toast.error(`Error: ${errorText}`);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      toast.error('Error de conexión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
      setCreatingUser(null);
      setUsername('');
    }
  };

  /**
   * Manejar eventos de teclado en el input
   * @param e - Evento del teclado
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Filtrar usuarios según el término de búsqueda (excluyendo al usuario actual)
  const filteredUsers = allUsers.filter(user => 
    user.username !== currentUser &&
    (user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-user-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Header del modal */}
        <div className="modal-header">
          <h3>Iniciar Chat Privado</h3>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        
        {/* Cuerpo del modal */}
        <div className="modal-body">
          <div className="modal-body-content">
            <p className="modal-description">
              Selecciona un usuario para iniciar una conversación privada
            </p>
            
            {/* Búsqueda de usuarios */}
            <div className="search-section">
              <div className="form-group">
                <label className="form-label">Buscar usuario</label>
                <div className="search-input-container">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>
            </div>

            {/* Lista de usuarios */}
            <div className="users-list-container">
              {usersLoading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Cargando usuarios...</p>
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="users-list">
                  {filteredUsers.map((user) => {
                    const existingDM = findExistingDM(user.username);
                    const isCreating = creatingUser === user.username;
                    
                    return (
                      <div
                        key={user.idUser}
                        className={`user-item ${existingDM ? 'has-existing-chat' : ''} ${isCreating ? 'creating' : ''}`}
                        onClick={() => !existingDM && !isCreating && handleAdd(user.username)}
                      >
                        <div className="user-avatar">
                          <div className="avatar-placeholder">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        
                        <div className="user-info">
                          <div className="user-main">
                            <span className="user-name">{user.name}</span>
                            <span className="user-username">@{user.username}</span>
                          </div>
                          {existingDM && (
                            <div className="existing-chat-badge">
                              <span className="badge-icon">✓</span>
                              Chat existente
                            </div>
                          )}
                        </div>

                        <div className="user-action">
                          {existingDM ? (
                            <button
                              className="btn-open-chat"
                              onClick={(e) => {
                                e.stopPropagation();
                                onChannelSelected(existingDM);
                                onClose();
                              }}
                            >
                              Abrir Chat
                            </button>
                          ) : (
                            <button
                              className={`btn-start-chat ${isCreating ? 'loading' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAdd(user.username);
                              }}
                              disabled={isCreating}
                            >
                              {isCreating ? (
                                <>
                                  <div className="button-spinner"></div>
                                  Creando...
                                </>
                              ) : (
                                'Chatear'
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <p className="empty-message">
                    {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios disponibles'}
                  </p>
                  {searchTerm && (
                    <p className="empty-hint">Intenta con otros términos de búsqueda</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}