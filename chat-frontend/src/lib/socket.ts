import { io, Socket } from "socket.io-client";

let socket: Socket;

// Verifica que esté en el navegador antes de inicializar
if (typeof window !== "undefined") {
    const token = localStorage.getItem("token") || "";

    socket = io("http://localhost:3000", {
        auth: { token },
    });
} else {
    // Si no está en el navegador, crea un socket falso para evitar errores
    socket = {
        on: () => { },
        off: () => { },
        emit: () => { },
        connected: false,
        disconnected: true,
    } as unknown as Socket;
}

export default socket;