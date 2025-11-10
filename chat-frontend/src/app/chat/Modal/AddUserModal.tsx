import { useState, useEffect } from 'react';
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
      if (!ch || ch.isPublic) return false;
      
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
      alert('Por favor ingresa un nombre de usuario');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert("Debes iniciar sesión");
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
          alert('Error: Respuesta inesperada del servidor');
        }
      } else {
        const errorText = await res.text();
        console.error('Error del servidor:', errorText);
        alert(`Error: ${errorText}`);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      alert('Error de conexión. Intenta nuevamente.');
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        
        {/* Header del modal */}
        <div className="modal-header">
          <h3>Iniciar Chat Privado</h3>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        
        {/* Cuerpo del modal */}
        <div className="modal-body">
          <p>Selecciona un usuario para iniciar una conversación privada</p>
          
          {/* Búsqueda de usuarios */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Buscar usuario:</label>
            <input
              type="text"
              placeholder="Buscar por nombre o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Lista de usuarios */}
          <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
            {usersLoading ? (
              <p>Cargando usuarios...</p>
            ) : filteredUsers.length > 0 ? (
              <div className="user-list">
                {filteredUsers.map((user) => {
                  // Verificar si ya existe un DM con este usuario
                  const existingDM = findExistingDM(user.username);
                  const isCreating = creatingUser === user.username;
                  
                  return (
                    <div
                      key={user.idUser}
                      className={`user-item ${existingDM || isCreating ? 'user-item-disabled' : ''}`}
                      onClick={() => !existingDM && !isCreating && handleAdd(user.username)}
                      style={{
                        padding: '12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        cursor: existingDM || isCreating ? 'not-allowed' : 'pointer',
                        backgroundColor: existingDM || isCreating ? '#f3f4f6' : 'white',
                        opacity: existingDM || isCreating ? 0.6 : 1,
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ display: 'block', fontSize: '14px' }}>
                            {user.username}
                            {isCreating && " - Creando..."}
                          </strong>
                          <small style={{ color: '#6b7280' }}>
                            {user.name}
                          </small>
                        </div>
                        {/* Mostrar "Abrir Chat" si existe DM o "Chatear" para crear nuevo */}
                        {existingDM ? (
                          <button
                            className="btn-secondary"
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px'
                            }}
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
                            className="btn-primary"
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdd(user.username);
                            }}
                            disabled={isCreating}
                          >
                            {isCreating ? 'Creando...' : 'Chatear'}
                          </button>
                        )}
                      </div>
                      {/* Indicador visual para DMs existentes */}
                      {existingDM && (
                        <small style={{ color: '#10b981', display: 'block', marginTop: '4px' }}>
                          ✓ Ya tienes un chat con este usuario
                        </small>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#6b7280' }}>
                {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios disponibles'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}