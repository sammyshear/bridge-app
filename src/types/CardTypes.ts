export interface PlayingCard {
	suit: Suit;
	num: number;
}

export type Suit = "Spades" | "Hearts" | "Diamonds" | "Clubs";
export type TrumpSuit = Suit | "NoTrump";

export interface Bid {
	suit: TrumpSuit;
	num: number;
}
