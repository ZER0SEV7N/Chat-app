//chat-frontend/src/app/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const goToRegister = () => {
    router.push("/register");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!formData.username || !formData.password) {
      setError("Por favor completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message || "Credenciales inválidas ❌");
        return;
      }
      
      // ✅ CORRECCIÓN: Guardar TODOS los datos necesarios
      localStorage.setItem("token", data.access_token);
      
      // Guardar datos del usuario individualmente
      if (data.user) {
        localStorage.setItem("username", data.user.username || formData.username);
        localStorage.setItem("idUser", data.user.id?.toString() || "");
        
        // También mantener el objeto user completo por compatibilidad
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        // Fallback: si el backend no envía user object
        localStorage.setItem("username", formData.username);
        localStorage.setItem("idUser", data.userId?.toString() || "");
      }
      
      console.log('✅ Datos guardados en localStorage:', {
        username: localStorage.getItem('username'),
        idUser: localStorage.getItem('idUser'),
        token: localStorage.getItem('token') ? '✅' : '❌'
      });
      
      // Redirigir al chat
      window.location.href = "/chat";
      
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

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

        <form onSubmit={handleLogin} className="auth-form">
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