<template>
  <div id="app">
    <h1>WhatsApp</h1>
    <Chat />
  </div>
</template>

<script>
import Chat from "./componente/chat.vue"; // 👈 asegúrate que exista exactamente esta ruta

export default {
  components: { Chat }
};
</script>

<style>
#app {
  font-family: Arial, sans-serif;
  text-align: center;
  margin: 20px;
}
</style>
