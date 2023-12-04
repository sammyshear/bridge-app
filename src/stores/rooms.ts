import { defineStore } from "pinia";
import type { ConnectionPayload, ConnectionRoomPayload, Player, Room } from "@/types/Room";
import { socket } from "@/socket";
import type { PlayingCard } from "@/types/CardTypes";

export const useRoomsStore = defineStore("rooms", {
  state: () => ({
    rooms: [] as Room[],
    player: {} as Player | undefined,
    hand: [] as PlayingCard[] | undefined,
    curRoom: {} as Room | undefined,
    connected: false,
    roomFull: false
  }),

  actions: {
    bindEvents() {
      socket.on("room-created", (r: Room) => {
        this.rooms.push(r);
        if (r.id === this.curRoom?.id) {
          this.connected = true;
        }
      });

      socket.on("room-full", (room: Room) => {
        this.rooms[this.rooms.findIndex((r: Room) => r.id === room.id)] = room;
        if (room.id === this.curRoom?.id) {
          this.roomFull = true;
          socket.emit("deal-hands", room);
        }
      });

      socket.on("hands-dealt", (room: Room) => {
        this.rooms[this.rooms.findIndex((r: Room) => r.id === room.id)] = room;
        if (room.id === this.curRoom?.id) {
          this.curRoom = room;
          this.player =
            this.curRoom.teams[this.player!.teamIndex].players[
            this.curRoom.teams[this.player!.teamIndex].players.findIndex(
              (p: Player) => p.id === this.player!.id
            )
            ]!;
          this.hand = this.player.hand;
        }
      });

      socket.on("connected-to-room", (payload: ConnectionRoomPayload) => {
        this.rooms[this.rooms.findIndex((r: Room) => r.id === payload.room.id)] =
          payload.room;
        if (this.player?.id === payload.player.id) {
          this.curRoom = payload.room;
          this.connected = true;
        }
      });

      socket.on("disconnected-from-room", (payload: ConnectionRoomPayload) => {
        this.rooms[this.rooms.findIndex((r: Room) => r.id === payload.room.id)] =
          payload.room;
        if (this.player?.id === payload.player.id) {
          this.curRoom = undefined;
          this.connected = false;
          this.roomFull = false;
        }
      });

      socket.on("room-deleted", (r: Room) => {
        this.rooms = this.rooms.filter((room: Room) => room.id !== r.id);
        if (r.id === this.curRoom?.id) {
          this.curRoom = undefined;
          this.connected = false;
          this.player = undefined;
          this.roomFull = false;
        }
      });
    },

    createRoom(id: string, player: Player) {
      this.player = player;
      const room: Room = { id, teams: [{ id: 0, players: [player] }], handsDealt: false };
      this.curRoom = room;
      socket.emit("create-room", room);
    },

    deleteRoom() {
      socket.emit("delete-room", this.curRoom!);
    },

    connectToRoom(roomId: string, player: Player) {
      this.player = player;
      const payload: ConnectionPayload = { roomId, player };
      socket.emit("connect-to-room", payload);
    },

    disconnectFromRoom() {
      const payload: ConnectionRoomPayload = { room: this.curRoom!, player: this.player! };
      socket.emit("disconnect-from-room", payload);
    }
  }
});
