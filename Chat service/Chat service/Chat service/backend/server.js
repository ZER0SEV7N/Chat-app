import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Datos de prueba
let users = [
  { id: 1, name: "Pedro" },
  { id: 2, name: "Ana" },
  { id: 3, name: "Luis" },
  { id: 4, name: "María" },
  { id: 5, name: "Carlos" },
  { id: 6, name: "Laura" }
];

let messages = [];
let connectedUsers = {}; // 👈 guardamos socket.id por userId

// Endpoints
app.get("/api/v1/data", (req, res) => {
  res.json(users);
});

app.get("/api/v1/messages/unread/:userId", (req, res) => {
  const userId = parseInt(req.params.userId);
  const userMessages = messages.filter(
    (m) => m.from === userId || m.to === userId
  );
  res.json(userMessages);
});

// Socket.IO
io.on("connection", (socket) => {
  console.log("Usuario conectado:", socket.id);

  // Cuando un usuario se conecta, debe mandar su ID
  socket.on("register", (userId) => {
    connectedUsers[userId] = socket.id;
    console.log(`Usuario ${userId} registrado con socket ${socket.id}`);
  });

  // Enviar mensaje privado
  socket.on("sendMessage", (msg) => {
    messages.push(msg);

    // Buscar socket del destinatario
    const toSocket = connectedUsers[msg.to];
    if (toSocket) {
      io.to(toSocket).emit("receiveMessage", msg); // 👈 solo al destinatario
    }

    // Opcional: también enviar al remitente (para que vea su mensaje reflejado)
    socket.emit("receiveMessage", msg);
  });

  socket.on("disconnect", () => {
    console.log("Usuario desconectado:", socket.id);
    // Eliminar de connectedUsers si se desconecta
    for (const [userId, sockId] of Object.entries(connectedUsers)) {
      if (sockId === socket.id) {
        delete connectedUsers[userId];
        break;
      }
    }
  });
});

server.listen(3500, () => console.log("Servidor corriendo en puerto 3500"));
