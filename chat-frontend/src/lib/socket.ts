import { io, Socket } from "socket.io-client";
import { API_URL } from "./config";
let socket: Socket;

// Verifica que esté en el navegador antes de inicializar
if (typeof window !== "undefined") {
    const token = localStorage.getItem("token") || "";

    socket = io(API_URL, {
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