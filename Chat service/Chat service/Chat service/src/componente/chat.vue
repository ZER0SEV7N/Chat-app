<template>
  <div class="chat-container">
    <!-- Lista de usuarios -->
    <div class="sidebar">
      <h3>Usuarios</h3>
      <ul>
        <li
          v-for="u in users"
          :key="u.id"
          :class="{ activo: u.id === destinatarioId }"
          @click="seleccionarDestinatario(u)"
        >
          {{ u.name }}
        </li>
      </ul>
    </div>

    <!-- Ventana de chat -->
    <div class="chat-window" v-if="destinatarioId">
      <div class="chat-header">
        <h3>{{ destinatarioName }}</h3>
      </div>
      <div class="chat-box">
        <div
          v-for="(msg, i) in mensajesFiltrados"
          :key="i"
          :class="msg.from == userId ? 'mio' : 'otro'"
        >
          <span>{{ msg.text }}</span>
        </div>
      </div>
      <div class="chat-input">
        <input
          v-model="nuevoMensaje"
          placeholder="Escribe un mensaje..."
          @keyup.enter="enviarMensaje"
        />
        <button @click="enviarMensaje">Enviar</button>
      </div>
    </div>

    <!-- Si no hay chat abierto -->
    <div class="chat-window empty" v-else>
      <p>Selecciona un usuario para chatear</p>
    </div>
  </div>
</template>

<script>
import { io } from "socket.io-client";
import axios from "axios";

export default {
  name: "Chat",
  data() {
    return {
      socket: null,
      users: [],
      userId: 1, // 🔹 temporalmente usuario fijo (luego lo hacemos dinámico)
      destinatarioId: null,
      destinatarioName: "",
      nuevoMensaje: "",
      mensajes: [],
    };
  },
  computed: {
    mensajesFiltrados() {
      return this.mensajes.filter(
        (m) =>
          (m.from == this.userId && m.to == this.destinatarioId) ||
          (m.from == this.destinatarioId && m.to == this.userId)
      );
    },
  },
  methods: {
    seleccionarDestinatario(u) {
      this.destinatarioId = u.id;
      this.destinatarioName = u.name;
    },
    enviarMensaje() {
      if (!this.nuevoMensaje || !this.destinatarioId) return;
      const msg = {
        from: this.userId,
        to: this.destinatarioId,
        text: this.nuevoMensaje,
      };
      this.socket.emit("sendMessage", msg);
      this.nuevoMensaje = "";
    },
  },
  async mounted() {
    this.socket = io("http://localhost:3500");
    this.socket.on("receiveMessage", (msg) => {
      this.mensajes.push(msg);
    });

    const res = await axios.get("http://localhost:3500/api/v1/data");
    this.users = res.data;
  },
};
</script>

<style>
.chat-container {
  display: flex;
  height: 90vh;
  border: 1px solid #ccc;
}

.sidebar {
  width: 25%;
  background: #f1f1f1;
  padding: 10px;
  border-right: 1px solid #ccc;
  overflow-y: auto;
}

.sidebar ul {
  list-style: none;
  padding: 0;
}

.sidebar li {
  padding: 10px;
  cursor: pointer;
  border-radius: 5px;
}

.sidebar li:hover {
  background: #ddd;
}

.sidebar .activo {
  background: #bbb;
  font-weight: bold;
}

.chat-window {
  width: 75%;
  display: flex;
  flex-direction: column;
}

.chat-header {
  background: #075e54;
  color: white;
  padding: 10px;
}

.chat-box {
  flex: 1;
  padding: 10px;
  background: #ece5dd;
  overflow-y: auto;
}

.mio {
  text-align: right;
  margin: 5px;
  color: white;
  background: #25d366;
  padding: 8px 12px;
  border-radius: 12px;
  display: inline-block;
}

.otro {
  text-align: left;
  margin: 5px;
  color: black;
  background: white;
  padding: 8px 12px;
  border-radius: 12px;
  display: inline-block;
}

.chat-input {
  display: flex;
  padding: 10px;
  background: #f0f0f0;
}

.chat-input input {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 20px;
  margin-right: 10px;
}

.chat-input button {
  background: #25d366;
  border: none;
  padding: 8px 12px;
  border-radius: 20px;
  color: white;
  cursor: pointer;
}
</style>
