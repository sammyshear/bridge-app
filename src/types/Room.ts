import type { Bid, PlayingCard, TrumpSuit } from "@/types/CardTypes";

export interface Player {
	roomId: string;
	id: string;
	name: string;
	hand: PlayingCard[];
	teamIndex: number;
}

export interface Team {
	id: number;
	players: Player[];
}

export interface Room {
	id: string;
	teams: Team[];
	currentTrump?: TrumpSuit;
	currentBid?: Bid;
	playingTeam?: Team;
	declarer?: Player;
	dummy?: Player;
}

export interface ConnectionPayload {
	room: Room;
	player: Player;
}
