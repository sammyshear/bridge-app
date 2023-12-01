import { reactive } from "vue";
import { io, Socket } from "socket.io-client";

export const state = reactive({
  connected: false,
  rooms: [],
  players: []
});

const URL = process.env.NODE_ENV === "production" ? window.location : "http://localhost:3000";

export const socket: Socket = io(URL);


