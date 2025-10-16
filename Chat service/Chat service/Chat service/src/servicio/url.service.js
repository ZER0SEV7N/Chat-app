// src/servicio/url.service.js
import axios from "axios";

const API_BASE = "http://localhost:3500/api/v1/";

export default {
  getWorkers() {
    return axios.get(`${API_BASE}data`);
  },

  getUnreadMessages(userId) {
    return axios.get(`${API_BASE}messages/unread/${userId}`);
  },

  getChatHistory(fromId, toId) {
    return axios.get(`${API_BASE}messages/${fromId}/${toId}`);
  },

  sendMessage(payload) {
    return axios.post(`${API_BASE}messages`, payload);
  },

  markAsRead(fromId, toId) {
    return axios.patch(`${API_BASE}messages/markAsRead`, { from: fromId, to: toId });
  }
};
