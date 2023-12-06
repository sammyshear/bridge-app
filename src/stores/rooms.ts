import { defineStore } from "pinia";
import type { ConnectionPayload, ConnectionRoomPayload, Player, Room } from "@/types/Room";
import { socket } from "@/socket";
import type { Bid, BidPayload, PlayedCard, PlayingCard, Trick } from "@/types/CardTypes";

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
          this.curRoom = room;
          socket.emit("deal-hands", this.curRoom);
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
          this.curRoom.playerWithBid = this.curRoom.teams[0].players[0];
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

      socket.on("played-card", (r: Room) => {
        this.rooms[this.rooms.findIndex((room: Room) => room.id === r.id)] = r;
        if (r.id === this.curRoom?.id) {
          this.curRoom = r;
          if (r.currentTrick!.length! === 4) {
            socket.emit("calculate-trick-winner", this.curRoom);
          }
        }
      });
      
      socket.on("calculated-trick-winner", (trick: Trick) => {
        this.rooms[this.rooms.findIndex((room: Room) => room.id === trick.room.id)] = trick.room;
        if (trick.room.id === this.curRoom?.id) {
          this.curRoom = trick.room;
          this.curRoom.currentTrick!.length = 0;
          if (this.curRoom.declarer!.hand.length === 0) {
            socket.emit("end-contract", this.curRoom);
          }
        }
      });

      socket.on("ended-contract", (room: Room) => {
        this.rooms[this.rooms.findIndex((r: Room) => r.id === room.id)] = room;
        if (room.id === this.curRoom?.id) {
          this.curRoom = room;
          socket.emit("check-game", this.curRoom);
        }
      });

      socket.on("game-checked", (room: Room) => {
        this.rooms[this.rooms.findIndex((r: Room) => r.id === room.id)] = room;
        if (room.id === this.curRoom?.id) {
          this.curRoom = room;
          this.curRoom.handsDealt = false;
          this.curRoom.currentBid = undefined;
          this.curRoom.currentTrump = undefined;
          this.curRoom.playingTeam = undefined;
          this.curRoom.teams[0].tricksWon = 0;
          this.curRoom.teams[1].tricksWon = 0;
          this.curRoom.numPassed = 0;
          this.curRoom.declarer = undefined;
          this.curRoom.dummy = undefined;
          socket.emit("deal-hands", this.curRoom);
          if (this.curRoom.teams[0].gamesWon === 2 || this.curRoom.teams[1].gamesWon === 2) {
            socket.emit("end-rubber", this.curRoom);
          }
        }
      });

      socket.on("bid-processed", (r: Room) => {
        this.rooms[this.rooms.findIndex((room: Room) => room.id === r.id)] = r;
        if (r.id === this.curRoom?.id) {
          this.curRoom = r;
          if (this.curRoom.playerWithBid!.id === this.curRoom.teams[0].players[0].id) {
            this.curRoom.playerWithBid = this.curRoom.teams[1].players[0];
          } else if (this.curRoom.playerWithBid!.id === this.curRoom.teams[0].players[1].id) {
            this.curRoom.playerWithBid = this.curRoom.teams[1].players[1];
          } else if (this.curRoom.playerWithBid!.id === this.curRoom.teams[1].players[0].id) {
            this.curRoom.playerWithBid = this.curRoom.teams[0].players[1];
          } else if (this.curRoom.playerWithBid!.id === this.curRoom.teams[1].players[1].id) {
            this.curRoom.playerWithBid = this.curRoom.teams[0].players[0];
          }
        }
      });

      socket.on("bid-finalized", (r: Room) => {
        this.rooms[this.rooms.findIndex((room: Room) => room.id === r.id)] = r;
        if (r.id === this.curRoom?.id) {
          this.curRoom = r;
          this.curRoom.playerWithBid = undefined;
        }
      });
      
      socket.on("new-deal", (room: Room) => {
        this.rooms[this.rooms.findIndex((r: Room) => r.id === room.id)] = room;
        if (room.id === this.curRoom?.id) {
          this.curRoom = room;
          socket.emit("deal-hands", room);
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
    },

    bid(bid: Bid) {
      const payload: BidPayload = { bid, player: this.player!, room: this.curRoom! };
      socket.emit("process-bid", payload);
    },

    sendPass() {
      const payload: BidPayload = { bid: "Pass", player: this.player!, room: this.curRoom! };
      if (this.curRoom!.numPassed === undefined) this.curRoom!.numPassed = 0;
      if (++this.curRoom!.numPassed! > 3) {
        socket.emit("finalize-bid", this.curRoom);
      } else {
        socket.emit("process-bid", payload);
      }
    },

    playCard(card: PlayingCard) {
      this.player!.hand = this.hand!.filter(
        (c: PlayingCard) => !(JSON.stringify(c) === JSON.stringify(card))
      );
      this.hand = this.player!.hand;
      this.curRoom!.teams[this.player!.teamIndex].players[
        this.curRoom!.teams[this.player!.teamIndex].players.findIndex(
          (p: Player) => p.id === this.player!.id
        )
      ] = this.player!;
      const playedCard: PlayedCard = { card, player: this.player! };
      socket.emit("play-card", playedCard);
    }
  }
});
