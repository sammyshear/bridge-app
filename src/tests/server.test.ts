import { Server, Socket as ServerSocket } from "socket.io";
import { io as ioc, Socket as ClientSocket } from "socket.io-client";
import { setupServer, waitFor } from "@/server/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { v4 } from "uuid";
import type { ConnectionPayload, Player, Room } from "@/types/Room";
import { generateUsername } from "unique-username-generator";
import type { BidPayload, PlayedCard, PlayingCard, Trick } from "@/types/CardTypes";

describe("socket.io connection tests", () => {
	let io: Server,
		clientSocket: ClientSocket,
		clientSocket2: ClientSocket,
		serverSocket: ServerSocket | undefined;

	beforeAll(async () => {
		const response = await setupServer();
		io = response.io;
		serverSocket = response.serverSocket;

		clientSocket = ioc("http://localhost:3000");
		clientSocket2 = ioc("http://localhost:3000");
		await waitFor(clientSocket, "connect");
		await waitFor(clientSocket2, "connect");
	});

	afterAll(() => {
		io.close();
		clientSocket.close();
		clientSocket2.close();
	});

	it("should create a new room", async () => {
		const room: Room = { teams: [], id: v4(), handsDealt: false };
		clientSocket.emit("create-room", room);

		const promises = [waitFor(clientSocket, "room-created")];
		const [res] = await Promise.all(promises);

		expect(res).toStrictEqual(room);
	});

	it("should delete a room", async () => {
		const roomId = v4();
		const player: Player = {
			id: v4(),
			roomId,
			teamIndex: 0,
			name: generateUsername(),
			hand: []
		};
		const room: Room = { teams: [{ players: [player], id: 0 }], id: roomId, handsDealt: false };
		clientSocket.emit("create-room", room);
		clientSocket.emit("delete-room", room);

		const promises = [
			waitFor(clientSocket, "room-created"),
			waitFor(clientSocket, "room-deleted")
		];
		const [res1, res2] = await Promise.all(promises);

		expect(res1).toStrictEqual(res2);
		expect(res2).toStrictEqual(room);
	});

	it("should create a room and connect a second player", async () => {
		const roomId = v4();
		const player1: Player = {
			id: v4(),
			roomId,
			teamIndex: 0,
			name: generateUsername(),
			hand: []
		};
		const player2: Player = {
			id: v4(),
			roomId,
			teamIndex: 0,
			name: generateUsername(),
			hand: []
		};
		const room: Room = {
			teams: [
				{ players: [player1], id: 0 },
				{ players: [], id: 1 }
			],
			id: roomId,
			handsDealt: false
		};
		clientSocket.emit("create-room", room);
		const res1 = await waitFor(clientSocket, "room-created");
		expect(res1).toStrictEqual(room);

		room.teams[0].players.push(player2);
		const payload = { room, player: player2 } as ConnectionPayload;
		clientSocket2.emit("connect-to-room", payload);
		const res2 = await waitFor(clientSocket2, "connected-to-room");
		expect(res2).toStrictEqual(payload);
	});
});

describe("socket.io game logic tests", () => {
	let io: Server,
		clientSocket: ClientSocket,
		clientSocket2: ClientSocket,
		clientSocket3: ClientSocket,
		clientSocket4: ClientSocket,
		serverSocket: ServerSocket | undefined;

	let player1: Player, player2: Player, player3: Player, player4: Player, room: Room;

	beforeAll(async () => {
		const response = await setupServer();
		io = response.io;
		serverSocket = response.serverSocket;

		clientSocket = ioc("http://localhost:3000", { multiplex: false });
		clientSocket2 = ioc("http://localhost:3000", { multiplex: false });
		clientSocket3 = ioc("http://localhost:3000", { multiplex: false });
		clientSocket4 = ioc("http://localhost:3000", { multiplex: false });
		await waitFor(clientSocket, "connect");
		await waitFor(clientSocket2, "connect");
		await waitFor(clientSocket3, "connect");
		await waitFor(clientSocket4, "connect");

		const roomId = v4();
		player1 = {
			id: v4(),
			roomId,
			teamIndex: 0,
			name: generateUsername(),
			hand: []
		};
		player2 = {
			id: v4(),
			roomId,
			teamIndex: 0,
			name: generateUsername(),
			hand: []
		};
		player3 = {
			id: v4(),
			roomId,
			teamIndex: 1,
			name: generateUsername(),
			hand: []
		};
		player4 = {
			id: v4(),
			roomId,
			teamIndex: 1,
			name: generateUsername(),
			hand: []
		};
		room = {
			teams: [
				{ players: [player1], id: 0 },
				{ players: [], id: 1 }
			],
			id: roomId,
			handsDealt: false
		};
		clientSocket.emit("create-room", room);

		room.teams[0].players.push(player2);
		let payload = { room, player: player2 } as ConnectionPayload;
		clientSocket2.emit("connect-to-room", payload);

		room.teams[1].players.push(player3);
		payload = { room, player: player3 } as ConnectionPayload;
		clientSocket3.emit("connect-to-room", payload);

		room.teams[1].players.push(player4);
		payload = { room, player: player4 } as ConnectionPayload;
		clientSocket4.emit("connect-to-room", payload);
	});

	afterAll(() => {
		io.close();
		clientSocket.disconnect();
		clientSocket2.disconnect();
		clientSocket3.disconnect();
		clientSocket4.disconnect();
	});

	it("should deal hands only once", async () => {
		clientSocket.emit("deal-hands", room);
		const res1 = await waitFor(clientSocket, "hands-dealt");
		expect(res1.id).toBe(room.id);
		room = res1;

		clientSocket2.emit("deal-hands", room);
		const res2 = await waitFor(clientSocket2, "hands-dealt");
		expect(res2.id).toBe(room.id);
		room = res2;

		clientSocket3.emit("deal-hands", room);
		const res3 = await waitFor(clientSocket3, "hands-dealt");
		expect(res3.id).toBe(room.id);
		room = res3;

		clientSocket4.emit("deal-hands", room);
		const res4 = await waitFor(clientSocket4, "hands-dealt");
		expect(res4.id).toBe(room.id);
		room = res4;

		expect(res1).toStrictEqual(res2);
		expect(res2).toStrictEqual(res3);
		expect(res3).toStrictEqual(res4);
	});

	it("should bid", async () => {
		const bidPayload: BidPayload = { room, player: player1, bid: { suit: "Spades", num: 1 } };

		clientSocket.emit("process-bid", bidPayload);
		const res1 = await waitFor(clientSocket, "bid-processed");
		expect(res1.currentBid).toStrictEqual(bidPayload.bid);
		room = res1;

		// client 3 will be left of client 1 at the table
		const passPayload: BidPayload = { room, player: player3, bid: "Pass" };
		clientSocket3.emit("process-bid", passPayload);
		const res2 = await waitFor(clientSocket, "bid-processed");
		expect(res2.currentBid).toStrictEqual(res1.currentBid);
		room = res2;

		const bidPayload2: BidPayload = { room, player: player2, bid: { suit: "Spades", num: 2 } };
		clientSocket2.emit("process-bid", bidPayload2);
		const res3 = await waitFor(clientSocket, "bid-processed");
		expect(res3.currentBid).toStrictEqual(bidPayload2.bid);
		room = res3;

		passPayload.room = room;
		passPayload.player = player4;
		clientSocket4.emit("process-bid", passPayload);
		const res4 = await waitFor(clientSocket, "bid-processed");
		expect(res4.currentBid).toStrictEqual(res3.currentBid);
		room = res4;

		clientSocket.emit("finalize-bid", room);

		const promises = [
			waitFor(clientSocket, "bid-finalized"),
			waitFor(clientSocket2, "bid-finalized"),
			waitFor(clientSocket3, "bid-finalized"),
			waitFor(clientSocket4, "bid-finalized")
		];

		const responses = await Promise.all(promises);
		responses.forEach((res: Room) => {
			expect(res.currentBid).toStrictEqual(bidPayload2.bid);
		});
	});

	it("should play a trick and calculate a winner", async () => {
		const bidPayload: BidPayload = { room, player: player1, bid: { suit: "Spades", num: 1 } };

		clientSocket.emit("process-bid", bidPayload);
		room = await waitFor(clientSocket, "bid-processed");

		// client 3 will be left of client 1 at the table
		const passPayload: BidPayload = { room, player: player3, bid: "Pass" };
		clientSocket3.emit("process-bid", passPayload);
		room = await waitFor(clientSocket, "bid-processed");

		const bidPayload2: BidPayload = { room, player: player2, bid: { suit: "Spades", num: 2 } };
		clientSocket2.emit("process-bid", bidPayload2);
		room = await waitFor(clientSocket, "bid-processed");

		passPayload.room = room;
		passPayload.player = player4;
		clientSocket4.emit("process-bid", passPayload);
		room = await waitFor(clientSocket, "bid-processed");

		clientSocket.emit("finalize-bid", room);

		const card1: PlayedCard = { card: { num: 14, suit: "Spades", name: "Ace" }, player: player1 };
		const card2: PlayedCard = { card: { num: 2, suit: "Spades", name: 2 }, player: player2 };
		const card3: PlayedCard = { card: { num: 7, suit: "Spades", name: 7 }, player: player3 };
		const card4: PlayedCard = { card: { num: 3, suit: "Spades", name: 3 }, player: player4 };

		clientSocket.emit("play-card", card1);	
		const res1: Room = await waitFor(clientSocket, "played-card");
		expect(res1.currentTrick![0]).toStrictEqual(card1);
		room = res1;

		clientSocket2.emit("play-card", card2);
		const res2: Room = await waitFor(clientSocket, "played-card");
		expect(res2.currentTrick![1]).toStrictEqual(card2);
	
		clientSocket3.emit("play-card", card3);
		const res3: Room = await waitFor(clientSocket, "played-card");
		expect(res3.currentTrick![2]).toStrictEqual(card3);
		room = res3;

		clientSocket4.emit("play-card", card4);
		const res4: Room = await waitFor(clientSocket, "played-card");
		expect(res4.currentTrick![3]).toStrictEqual(card4);
		room = res4;

		clientSocket.emit("calculate-trick-winner", room);
		const res5: Trick = await waitFor(clientSocket, "calculated-trick-winner");
		expect(res5.trick).toStrictEqual(room.currentTrick);
		expect(res5.winner).toStrictEqual(player1);
		expect(res5.room.id).toBe(room.id);
	});
});
