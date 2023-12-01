import { Server, Socket as ServerSocket } from "socket.io";
import { io as ioc, Socket as ClientSocket } from "socket.io-client";
import { setupServer, waitFor } from "@/server/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { v4 } from "uuid";
import type { ConnectionPayload, Player, Room } from "@/types/Room";
import { generateUsername } from "unique-username-generator";

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

		clientSocket = ioc("http://localhost:3000");
		clientSocket2 = ioc("http://localhost:3000");
		clientSocket3 = ioc("http://localhost:3000");
		clientSocket4 = ioc("http://localhost:3000");
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
		clientSocket.close();
		clientSocket2.close();
		clientSocket3.close();
		clientSocket4.close();
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
});
