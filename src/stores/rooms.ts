import { defineStore } from "pinia";
import type { ConnectionPayload, Player, Room } from "@/types/Room";
import { socket } from "@/socket";

export const useRoomsStore = defineStore("rooms", {
  state: () => ({
    rooms: [] as Room[],
    player: {} as Player | undefined,
    curRoom: {} as Room | undefined,
    connected: false
  }),

  actions: {
    bindEvents() {
      socket.on("room-created", (r: Room) => {
        this.rooms.push(r);
        if (r.id === this.curRoom?.id) {
          this.connected = true;
        }
      });

      socket.on("connected-to-room", (payload: ConnectionPayload) => {
        this.rooms[this.rooms.findIndex((r: Room) => r.id === payload.room.id)] =
          payload.room;
        if (this.player?.id === payload.player.id) {
          this.curRoom = payload.room;
          this.connected = true;
        }
      });

      socket.on("disconnected-from-room", (payload: ConnectionPayload) => {
        this.rooms[this.rooms.findIndex((r: Room) => r.id === payload.room.id)] =
          payload.room;
        if (this.player?.id === payload.player.id) {
          this.curRoom = undefined;
          this.connected = false;
        }
      });

      socket.on("room-deleted", (r: Room) => {
        this.rooms = this.rooms.filter((room: Room) => room.id !== r.id);
        if (r.id === this.curRoom?.id) {
          this.curRoom = undefined;
          this.connected = false;
          this.player = undefined;
        }
      });
    },

    createRoom(id: string, player: Player) {
      this.player = player;
      const room: Room = { id, teams: [{ id: 0, players: [player] }] };
      this.curRoom = room;
      socket.emit("create-room", room);
    },

    deleteRoom() {
      socket.emit("delete-room", this.curRoom!);
    },

    connectToRoom(room: Room, player: Player) {
      const payload: ConnectionPayload = { room, player };
      socket.emit("connect-to-room", payload);
    },

    disconnectFromRoom() {
      const payload: ConnectionPayload = { room: this.curRoom!, player: this.player! };
      socket.emit("disconnect-from-room", payload);
    }
  }
});
