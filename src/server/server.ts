import type { BidPayload, PlayedCard, Trick } from "@/types/CardTypes";
import type { ConnectionPayload, Player, Room } from "@/types/Room";
import { dealHands } from "@/util/CardUtil";
import { Server, Socket } from "socket.io";
import type { Socket as ClientSocket } from "socket.io-client";

let rooms: Room[] = [];

export async function waitFor(socket: ClientSocket, event: string) {
	return new Promise<any>((resolve) => {
		socket.once(event, resolve);
	});
}

export function handleSocketEvents(io: Server, socket: Socket) {
	const socketEvents: Record<string, (data: any) => void> = {
		"create-room": (data: Room) => {
			rooms.push(data);
			socket.join(data.id);
			socket.emit("room-created", data);
		},
		"delete-room": (data: Room) => {
			rooms = rooms.filter((r: Room) => r.id !== data.id);
			io.to(data.id).emit("room-deleted", data);
			socket.leave(data.id);
		},
		"connect-to-room": (data: ConnectionPayload) => {
			rooms[rooms.findIndex((r: Room) => r.id === data.room.id)] = data.room;
			socket.join(data.room.id);
			socket.emit("connected-to-room", data);
			if (
				data.room.teams.length === 2 &&
				data.room.teams[0].players.length === 2 &&
				data.room.teams[1].players.length === 2
			) {
				io.to(data.room.id).emit("room-full", data.room);
			}
		},
		"disconnect-from-room": (data: ConnectionPayload) => {
			rooms[rooms.findIndex((r: Room) => r.id === data.room.id)] = data.room;
			socket.leave(data.room.id);
			socket.emit("disconnected-from-room", data);
		},
		"deal-hands": (data: Room) => {
			dealHands(data);
			data.handsDealt = true;
			rooms[rooms.findIndex((r: Room) => r.id === data.id)] = data;
			io.to(data.id).emit("hands-dealt", data);
		},
		"process-bid": (data: BidPayload) => {
			if (data.room.currentBid === undefined && data.bid !== "Pass") {
				data.room.currentBid = data.bid;
				data.room.declarer = data.player;
			} else if (data.bid !== "Pass" && data.room.currentBid !== undefined) {
				switch (data.room.currentBid.suit) {
					case "Spades":
						if (data.bid.num > data.room.currentBid.num) {
							data.room.currentBid = data.bid;
						} else if (
							data.bid.suit === "NoTrump" &&
							data.bid.num === data.room.currentBid.num
						) {
							data.room.currentBid = data.bid;
						}
					case "Hearts":
						if (data.bid.num > data.room.currentBid.num) {
							data.room.currentBid = data.bid;
						} else if (
							(data.bid.suit === "Spades" || data.bid.suit === "NoTrump") &&
							data.room.currentBid.num === data.bid.num
						) {
							data.room.currentBid = data.bid;
						}
					case "Diamonds":
						if (data.bid.num > data.room.currentBid.num) {
							data.room.currentBid = data.bid;
						} else if (
							(data.bid.suit === "Spades" ||
								data.bid.suit === "Hearts" ||
								data.bid.suit === "NoTrump") &&
							data.bid.num === data.room.currentBid.num
						) {
							data.room.currentBid = data.bid;
						}
					case "Clubs":
						if (data.bid.num > data.room.currentBid.num) {
							data.room.currentBid = data.bid;
						} else if (
							(data.bid.suit === "Spades" ||
								data.bid.suit === "Hearts" ||
								data.bid.suit === "Diamonds" ||
								data.bid.suit === "NoTrump") &&
							data.room.currentBid.num === data.bid.num
						) {
							data.room.currentBid = data.bid;
						}
					case "NoTrump":
						if (data.bid.num > data.room.currentBid.num) {
							data.room.currentBid = data.bid;
						}
				}
				if (data.room.declarer !== undefined) {
					if (data.room.declarer.teamIndex !== data.player.teamIndex) {
						data.room.declarer = data.player;
					}
				}
			}
			io.to(data.room.id).emit("bid-processed", data.room);
		},
		"finalize-bid": (data: Room) => {
			data.currentTrump = data.currentBid!.suit;
			data.dummy = data.teams[data.declarer!.teamIndex].players.find(
				(p: Player) => p.id !== data.declarer!.id
			);
			rooms[rooms.findIndex((r: Room) => r.id === data.id)] = data;
			io.to(data.id).emit("bid-finalized", data);
		},
		"play-card": (data: PlayedCard) => {
			const room = rooms.find((r: Room) => r.id === data.player.roomId)!;
			if (room.currentTrick === undefined || room.currentTrick.length >= 4)
				room.currentTrick = [];
			room.currentTrick.push(data);
			io.to(room.id).emit("played-card", room);
		},
		"calculate-trick-winner": (data: Room) => {
			const firstCardSuit = data.currentTrick![0].card.suit;
			let winningCard: PlayedCard = data.currentTrick![0];

			for (const pCard of data.currentTrick!) {
				if (pCard.card.suit !== firstCardSuit) {
					if (pCard.card.suit === data.currentTrump!) {
						winningCard = pCard;
					}
				} else {
					if (
						pCard.card.num > winningCard.card.num &&
						winningCard.card.suit !== data.currentTrump!
					) {
						winningCard = pCard;
					}
				}
			}

			const trick: Trick = {
				trick: data.currentTrick!,
				winner: winningCard.player,
				room: data
			};
			if (trick.room.teams[trick.winner.teamIndex].tricksWon === undefined)
				trick.room.teams[trick.winner.teamIndex].tricksWon = 0;
			trick.room.teams[trick.winner.teamIndex].tricksWon!++;
			rooms[rooms.findIndex((r: Room) => r.id === data.id)] = trick.room;

			io.to(data.id).emit("calculated-trick-winner", trick);
		},
		"end-contract": (data: Room) => {
			console.log(data);
			if (data.teams[data.declarer!.teamIndex].score === undefined) {
				data.teams[data.declarer!.teamIndex].score = { belowLine: 0, aboveLine: 0 };
			}
			if (data.teams[data.declarer!.teamIndex === 0 ? 1 : 0].score === undefined) {
				data.teams[data.declarer!.teamIndex === 0 ? 1 : 0].score = {
					belowLine: 0,
					aboveLine: 0
				};
			}
			if (data.teams[data.declarer!.teamIndex].tricksWon! >= 6 + data.currentBid!.num) {
				let addToBelow = 0;
				let addToAbove = 0;
				switch (data.currentBid!.suit) {
					case "Spades":
						addToBelow = 30 * data.currentBid!.num;
						addToAbove =
							30 *
							(data.teams[data.declarer!.teamIndex].tricksWon! -
								data.currentBid!.num -
								6);
						break;
					case "Hearts":
						addToBelow = 30 * data.currentBid!.num;
						addToAbove =
							30 *
							(data.teams[data.declarer!.teamIndex].tricksWon! -
								data.currentBid!.num -
								6);
						break;
					case "Diamonds":
						addToBelow = 20 * data.currentBid!.num;
						addToAbove =
							20 *
							(data.teams[data.declarer!.teamIndex].tricksWon! -
								data.currentBid!.num -
								6);
						break;
					case "Clubs":
						addToBelow = 20 * data.currentBid!.num;
						addToAbove =
							20 *
							(data.teams[data.declarer!.teamIndex].tricksWon! -
								data.currentBid!.num -
								6);
						break;
					case "NoTrump":
						addToBelow = 40 + 30 * data.currentBid!.num;
						addToAbove =
							30 *
							(data.teams[data.declarer!.teamIndex].tricksWon! -
								data.currentBid!.num -
								6);
						break;
				}
				data.teams[data.declarer!.teamIndex].score!.belowLine += addToBelow;
				data.teams[data.declarer!.teamIndex].score!.aboveLine += addToAbove;
			} else {
				console.log(data.teams[data.declarer!.teamIndex === 0 ? 1 : 0].score);
				data.teams[data.declarer!.teamIndex === 0 ? 1 : 0].score!.aboveLine += 100;
			}

			io.to(data.id).emit("ended-contract", data);
		}
	};

	for (let event in socketEvents) {
		socket.on(event, socketEvents[event]);
	}
}

export async function setupServer(): Promise<{ io: Server; serverSocket: Socket | undefined }> {
	const io = new Server(3000, { cors: { origin: "http://localhost:5173" } });

	let serverSocket: Socket | undefined;

	io.on("connection", (socket) => {
		serverSocket = socket;
		handleSocketEvents(io, serverSocket);
	});

	return { io, serverSocket };
}
