'use client';
import { use, useEffect } from "react";
import { io } from "socket.io-client";
import Image from "next/image";

export default function Home() {
  useEffect(() => {
    const socket = io("http://localhost:3000", {
      auth: { token: localStorage.getItem("token") },
    });

    socket.on("connect", () => {
      console.log("Conectado al servidor de chat");
    });

    socket.on("newMessage", (msg) => {
      console.log("Nuevo mensaje:", msg);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="login-container">
        <h2>Iniciar Sesión</h2>
        <form action="/login" method="post">
            <div className="input-group">
                <label htmlFor="username">Usuario:</label>
                <input type="text" id="username" name="username" required />
            </div>
            <div className="input-group">
                <label htmlFor="password">Contraseña:</label>
                <input type="password" id="password" name="password" required />
            </div>
            <button type="submit">Entrar</button>
        </form>
    </div>
  );
}
