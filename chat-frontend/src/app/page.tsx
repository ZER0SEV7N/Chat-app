"use client";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Head from 'next/head';

export default function LoginPage() {

  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const goToRegister = () => {
    router.push("/register"); //redirige
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Error en login ❌");
      return;
    }

    localStorage.setItem("token", data.access_token);
    alert("Login exitoso ✅");
    window.location.href = "/chat";
  };

  return (
    <div>
      <Head>
          <title>Iniciar sesión - Chat App</title>
          <meta name="description" content="Intento de cambiar el nombre de la cabecera" />
      </Head>
      <div className="login-container">
        <h1 className="login-title">
          Iniciar sesión
        </h1>
        <form onSubmit={handleLogin} className="input-group">
          <div>
            <label className="input-group">
              Usuario: 
            </label>
            <input type="text" placeholder="Ingresa tu usuario" value={username} onChange={(e) => setUsername(e.target.value)} 
            className="input-group"
            />
          </div>
          <div>
            <label className="input-group">
              Contraseña: 
            </label>
            <input
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-group"
            />
          </div>
          <button
            type="submit"
            className="login-btn"
          >
            Entrar
          </button>
        </form>
        <p className="register-footer">
          <button
          type="button"
          onClick={goToRegister}
          className="register-btn">
          ¿No tienes cuenta? Regístrate
        </button>
        </p>
      </div>
    </div>
  );
}
