import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

if (typeof window !== "undefined") {
    // Esto solo se ejecuta en el navegador
    const token = localStorage.getItem("token");

    socket = io("http://localhost:3000", {
        auth: { token }
    });
}

export default socket;

