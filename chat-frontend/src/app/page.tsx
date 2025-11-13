//chat-frontend/src/app/page.tsx
//Página de login
//Importar hooks necesarios
"use client"; // Indica que este es un componente del lado del cliente
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";

//Componente de la página de login
export default function LoginPage() {
  //Hooks de estado y router
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  //Función para redirigir a la página de registro
  const goToRegister = () => {
    router.push("/register"); //redirige a la página de registro
  };

  //Función para manejar el envío del formulario de login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    //Validar el Front antes de enviar
    if (!formData.username || !formData.password) {
      setError("Por favor completa todos los campos");
      return;
    }

    setLoading(true); // Iniciar estado de carga
    try {
      //Realizar la petición al endpoint de login
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST", // Método POST
        headers: { "Content-Type": "application/json" }, // Encabezados
        body: JSON.stringify(formData), // Cuerpo de la solicitud como JSON
      });
      
      //Procesar la respuesta
      const data = await res.json();
      
      // Manejar la respuesta del servidor
      if (!res.ok) {
        // Mostrar mensaje de error si las credenciales son inválidas
        setError(data.message || "Credenciales inválidas ❌");
        return;
      }
      
      //Guardar el token y redirigir al chat si el login es exitoso
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/chat"; // Redirigir al chat
      
    //Capturar otros errores
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar cambios en los inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header del login */}
        <div className="auth-header">
          <div className="auth-logo">💬</div>
          <h1 className="auth-title">Iniciar sesión</h1>
          <p className="auth-subtitle">Ingresa a tu cuenta para continuar chateando</p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="error-message">
            <span>⚠️</span>
            {error}
          </div>
        )}

        {/* Formulario de login */}
        <form onSubmit={handleLogin} className="auth-form">
          {/* Campo de usuario */}
          <div className="form-group">
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
                required
              />
              {/* Botón para mostrar/ocultar contraseña */}
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {/* Botón de envío */}
          <button
            type="submit"
            className={`auth-button btn-primary ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
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

        {/* Enlace a registro */}
        <div className="auth-links">
          <p className="auth-text">
            <button 
              type="button" 
              onClick={goToRegister}
              className="auth-link"
              disabled={loading}
            >
              ¿No tienes cuenta? Regístrate
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}