import type { Room } from "@/types/Room";
import { Server, Socket }  from "socket.io";
import type { Socket as ClientSocket } from "socket.io-client";

const rooms: Room[] = [];

export async function waitFor(socket: ClientSocket, event: string) {
	return new Promise<any>((resolve) => {
		socket.once(event, resolve);
	});
}

export function handleSocketEvents(io: Server, socket: Socket) {
	const socketEvents: Record<string, (data: any) => void> = {
		"create-room": (data) => {
			rooms.push(data);
			socket.emit("room-created", data);
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
