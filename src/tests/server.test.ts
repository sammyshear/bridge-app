import { Server, Socket as ServerSocket } from "socket.io";
import { io as ioc, Socket as ClientSocket } from "socket.io-client";
import { setupServer, waitFor } from "@/server/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { v4 } from "uuid";
import type { Room } from "@/types/Room";

describe("socket.io server integration tests", () => {
	let io: Server,
		clientSocket: ClientSocket,
		clientSocket2: ClientSocket,
		clientSocket3: ClientSocket,
		clientSocket4: ClientSocket,
		serverSocket: ServerSocket | undefined;

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
	});

	afterAll(() => {
		io.close();
		clientSocket.close();
		clientSocket2.close();
		clientSocket3.close();
		clientSocket4.close();
	});

	it("should create a new room", async () => {
		const room: Room = { teams: [], id: v4() };
		clientSocket.emit("create-room", room);

		const promises = [waitFor(clientSocket, "room-created")];
		const [res] = await Promise.all(promises);

		expect(res).toStrictEqual(room);
	});
});
