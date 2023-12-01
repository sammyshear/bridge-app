import { defineStore } from "pinia";
import type { Room } from "@/types/Room";
import { socket } from "@/socket";

export const useRoomsStore = defineStore("rooms", {
  state: () => ({
    rooms: [] as Room[]
  }),

  actions: {
    bindEvents() {
      socket.on("room-created", (r: Room) => {
        this.rooms.push(r);
      });

      socket.on("room-deleted", (r: Room) => {
        this.rooms = this.rooms.filter((room: Room) => room.id !== r.id);
      });
    },

    createRoom(id: string) {
      const room: Room = { id, teams: [] };
      socket.emit("create-room", room);
    }
  }
});
