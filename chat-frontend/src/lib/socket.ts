// chat-frontend/src/lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket;

if (typeof window !== "undefined") {
    const token = localStorage.getItem("token") || "";

    socket = io("http://192.168.1.4:3000", {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
    });
} else {
    socket = {
        on: () => { },
        off: () => { },
        emit: () => { },
        connected: false,
        disconnected: true,
    } as unknown as Socket;
}

export default socket;
