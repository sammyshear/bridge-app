import type { ConnectionPayload, Room } from "@/types/Room";
import { dealHands } from "@/util/CardUtil";
import { Server, Socket }  from "socket.io";
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
			if (data.room.teams.length === 2 && data.room.teams[0].players.length === 2 && data.room.teams[1].players.length === 2) {
				io.to(data.room.id).emit("room-full");
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
