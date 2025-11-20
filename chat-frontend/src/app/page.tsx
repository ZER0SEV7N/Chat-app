//chat-frontend/src/app/page.tsx
//Pagina de login de la aplicacion de chat - Pagina inicial
"use client";
//Importaciones Importantess
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";
//Componente de la pagina de login
export default function LoginPage() {
  const router = useRouter(); //Hook para la navegacion
  const [formData, setFormData] = useState({ //Estado para los datos del formulario
    username: "", //Nombre de usuario
    password: "" //Contraseña
  });
  const [error, setError] = useState(""); //Estado para los mensajes de error
  const [loading, setLoading] = useState(false); //Estado para indicar carga
  const [showPassword, setShowPassword] = useState(false); //Estado para mostrar/ocultar contraseña

  //Funcion para redirigir a la pagina de registro
  const goToRegister = () => {
    router.push("/register");
  };
  //Funcion para manejar el envio del formulario de login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); //Prevenir el comportamiento por defecto del formulario
    setError(""); //Limpiar mensajes de error
    //Validar que los campos no esten vacios
    if (!formData.username || !formData.password) {
      setError("Por favor completa todos los campos");
      return; // Detener la ejecución si hay campos vacíos
    }
    //Enviar los datos al backend para autenticar al usuario
    setLoading(true);
    try {
      //Realizar la peticion al backend
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST", //Metodo HTTP POST para enviar datos
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      //Parsear la respuesta JSON
      const data = await res.json();
      //Si la respuesta no es OK, mostrar el mensaje de error
      if (!res.ok) {
        setError(data.message || "Credenciales inválidas ❌");
        return;
      }
      //Guardar el token y redirigir al chat si el login es exitoso
      localStorage.setItem("token", data.access_token);
      
      // Guardar datos del usuario individualmente
      if (data.user) {
        localStorage.setItem("username", data.user.username || formData.username);
        localStorage.setItem("idUser", data.user.id?.toString() || "");
        
        //También mantener el objeto user completo por compatibilidad
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        //Fallback: si el backend no envía user object
        localStorage.setItem("username", formData.username);
        localStorage.setItem("idUser", data.userId?.toString() || "");
      }
      //Mostrar en consola los datos guardados
      console.log('✅ Datos guardados en localStorage:', {
        username: localStorage.getItem('username'),
        idUser: localStorage.getItem('idUser'),
        token: localStorage.getItem('token') ? '✅' : '❌'
      });
      
      //Redirigir al chat
      window.location.href = "/chat";
      
      //Guardar datos del usuario individualmente
      if (data.user) {
        localStorage.setItem("username", data.user.username || formData.username);
        localStorage.setItem("idUser", data.user.id?.toString() || "");
        
        //También mantener el objeto user completo por compatibilidad
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        //Fallback: si el backend no envía user object
        localStorage.setItem("username", formData.username);
        localStorage.setItem("idUser", data.userId?.toString() || "");
      }
      
      console.log('✅ Datos guardados en localStorage:', {
        username: localStorage.getItem('username'),
        idUser: localStorage.getItem('idUser'),
        token: localStorage.getItem('token') ? '✅' : '❌'
      });
      
      //Redirigir al chat
      window.location.href = "/chat";
      
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };
  //Funcion para manejar los cambios en los campos del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  //Renderizado del componente
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">💬</div>
          <h1 className="auth-title">Iniciar sesión</h1>
          <p className="auth-subtitle">Ingresa a tu cuenta para continuar chateando</p>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span>
            {error}
          </div>
        )}
        {/* Formulario de login */}
        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            {/* Campo de usuario */}
            <label className="form-label" htmlFor="username">
              Usuario:
            </label>
            <div className="input-with-icon">
              <span className="input-icon">👤</span>
              <input
                id="username"
                name="username"
                type="text"
                className="form-input"
                placeholder="Ingresa tu usuario"
                value={formData.username}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>
          </div>
          {/* Campo de contraseña */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Contraseña:
            </label>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                required/>
              {/* Boton para mostrar/ocultar contraseña */}
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}>
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>
          {/* Boton de inicio de sesion */}
          <button
            type="submit"
            className={`auth-button btn-primary ${loading ? 'loading' : ''}`}
            disabled={loading}>
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Iniciando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
        {/* Enlace para ir a la página de registro */}
        <div className="auth-links">
          <p className="auth-text">
            <button 
              type="button" 
              onClick={goToRegister}
              className="auth-link"
              disabled={loading}>
              ¿No tienes cuenta? Regístrate
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}