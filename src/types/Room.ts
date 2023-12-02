import type { Bid, PlayedCard, PlayingCard, TrumpSuit } from "@/types/CardTypes";

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
	tricksWon?: number;
	score?: Score;
}

export interface Score {
	aboveLine: number;
	belowLine: number;
}

export interface Room {
	id: string;
	teams: Team[];
	currentTrump?: TrumpSuit;
	currentBid?: Bid;
	currentTrick?: PlayedCard[];
	playingTeam?: Team;
	declarer?: Player;
	dummy?: Player;
	handsDealt: boolean;
}

export interface ConnectionPayload {
	room: Room;
	player: Player;
}
