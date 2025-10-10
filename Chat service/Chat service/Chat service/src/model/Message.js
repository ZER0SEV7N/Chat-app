const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    from: { type: String, required: true }, // ID del remitente
    to: { type: String, required: true }, // ID del destinatario
    message: { type: String, required: true }, // Contenido del mensaje
    timestamp: { type: Date, default: Date.now }, // Marca de tiempo
});

module.exports = mongoose.model("Message", MessageSchema);
