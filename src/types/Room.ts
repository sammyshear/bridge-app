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
	gamesWon?: number;
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
	gameIndex?: number;
	rubberIndex?: number;
}

export interface ConnectionPayload {
	room: Room;
	player: Player;
}
