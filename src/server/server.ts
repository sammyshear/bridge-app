import type { ConnectionPayload, Room } from "@/types/Room";
import { Server, Socket }  from "socket.io";
import type { Socket as ClientSocket } from "socket.io-client";
import { v4 } from "uuid";

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
			socket.emit("room-created", data);
		},
		"delete-room": (data: Room) => {
			rooms = rooms.filter((r: Room) => r.id !== data.id);
			socket.emit("room-deleted", data);
		},
		"connect-to-room": (data: ConnectionPayload) => {
			rooms[rooms.findIndex((r: Room) => r.id === data.room.id)] = data.room;
			socket.emit("connected-to-room", data);
		},
		"disconnect-from-room": (data: ConnectionPayload) => {
			rooms[rooms.findIndex((r: Room) => r.id === data.room.id)] = data.room;
			socket.emit("disconnected-from-room", data);
		}
	};

	for (let event in socketEvents) {
		socket.on(event, socketEvents[event]);
	}
}

export async function setupServer(): Promise<{ io: Server, serverSocket: Socket | undefined }> {
	const io = new Server(3000, { cors: { origin: "http://localhost:5173" } });

	let serverSocket: Socket | undefined;

	io.on("connection", (socket) => {
		serverSocket = socket;
		handleSocketEvents(io, serverSocket);
	});

	return { io, serverSocket };
}
