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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  //Función para redirigir a la página de registro
  const goToRegister = () => {
    router.push("/register"); //redirige a la página de registro
  };
  //Función para manejar el envío del formulario de login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    //Validar el Front antes de enviar
    if (!username || !password) {
      setError("Por favor completa todos los campos");
      return;
    }

    setLoading(true); // Iniciar estado de carga
    try {
      //Realizar la petición al endpoint de login
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST", // Método POST
        headers: { "Content-Type": "application/json" }, // Encabezados
        body: JSON.stringify({ username, password }), // Cuerpo de la solicitud como JSON
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
      localStorage.setItem("username", data.user.username);
      window.location.href = "/chat"; // Redirigir al chat
    //Capturar otros errores
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="login-container">
        <h1 className="login-title">Iniciar sesión</h1>
        
        {/* Mensaje de error */}
        {error && <div className="error-message">{error}</div>}
        {/* Formulario de login */}
        <form onSubmit={handleLogin} className="input-group">
          <div>
            <label className="input-group"> Usuario: </label>
            <input type="text" placeholder="Ingresa tu usuario" value={username} onChange={(e) => setUsername(e.target.value)} 
            className="input-group"/>
          </div>
          {/* Campo de contraseña */}
          <div>
            <label className="input-group"> Contraseña: </label>
            <input type="password" placeholder="••••••" value={password} onChange={(e) => setPassword(e.target.value)}
              className="input-group" />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Iniciando..." : "Entrar"}
          </button>
        </form>
        <p className="register-footer">
          <button type="button" onClick={goToRegister}
          className="register-btn">¿No tienes cuenta? Regístrate
          </button>
        </p>
      </div>
  );
}
