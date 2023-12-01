export interface PlayingCard {
	suit: Suit;
	name: number | Facecard;
	num: number;
}
export type Facecard = "Ace" | "King" | "Queen" | "Jack";
export type Suit = "Spades" | "Hearts" | "Diamonds" | "Clubs";
export type TrumpSuit = Suit | "NoTrump";

export interface Bid {
	suit: TrumpSuit;
	num: number;
}

export const deck: PlayingCard[] = [
  { suit: "Spades", num: 14, name: "Ace", points: 4 } as PlayingCard,
  { suit: "Spades", num: 2, name: 2 } as PlayingCard,
  { suit: "Spades", num: 3, name: 3 } as PlayingCard,
  { suit: "Spades", num: 4, name: 4 } as PlayingCard,
  { suit: "Spades", num: 5, name: 5 } as PlayingCard,
  { suit: "Spades", num: 6, name: 6 } as PlayingCard,
  { suit: "Spades", num: 7, name: 7 } as PlayingCard,
  { suit: "Spades", num: 8, name: 8 } as PlayingCard,
  { suit: "Spades", num: 9, name: 9 } as PlayingCard,
  { suit: "Spades", num: 10, name: 10 } as PlayingCard,
  { suit: "Spades", num: 11, name: "Jack", points: 1 } as PlayingCard,
  { suit: "Spades", num: 12, name: "Queen", points: 2 } as PlayingCard,
  { suit: "Spades", num: 13, name: "King", points: 3 } as PlayingCard,
  { suit: "Clubs", num: 14, name: "Ace", points: 4 } as PlayingCard,
  { suit: "Clubs", num: 2, name: 2 } as PlayingCard,
  { suit: "Clubs", num: 3, name: 3 } as PlayingCard,
  { suit: "Clubs", num: 4, name: 4 } as PlayingCard,
  { suit: "Clubs", num: 5, name: 5 } as PlayingCard,
  { suit: "Clubs", num: 6, name: 6 } as PlayingCard,
  { suit: "Clubs", num: 7, name: 7 } as PlayingCard,
  { suit: "Clubs", num: 8, name: 8 } as PlayingCard,
  { suit: "Clubs", num: 9, name: 9 } as PlayingCard,
  { suit: "Clubs", num: 10, name: 10 } as PlayingCard,
  { suit: "Clubs", num: 11, name: "Jack", points: 1 } as PlayingCard,
  { suit: "Clubs", num: 12, name: "Queen", points: 2 } as PlayingCard,
  { suit: "Clubs", num: 13, name: "King", points: 3 } as PlayingCard,
  { suit: "Hearts", num: 14, name: "Ace", points: 4 } as PlayingCard,
  { suit: "Hearts", num: 2, name: 2 } as PlayingCard,
  { suit: "Hearts", num: 3, name: 3 } as PlayingCard,
  { suit: "Hearts", num: 4, name: 4 } as PlayingCard,
  { suit: "Hearts", num: 5, name: 5 } as PlayingCard,
  { suit: "Hearts", num: 6, name: 6 } as PlayingCard,
  { suit: "Hearts", num: 7, name: 7 } as PlayingCard,
  { suit: "Hearts", num: 8, name: 8 } as PlayingCard,
  { suit: "Hearts", num: 9, name: 9 } as PlayingCard,
  { suit: "Hearts", num: 10, name: 10 } as PlayingCard,
  { suit: "Hearts", num: 11, name: "Jack", points: 1 } as PlayingCard,
  { suit: "Hearts", num: 12, name: "Queen", points: 2 } as PlayingCard,
  { suit: "Hearts", num: 13, name: "King", points: 3 } as PlayingCard,
  { suit: "Diamonds", num: 14, name: "Ace", points: 4 } as PlayingCard,
  { suit: "Diamonds", num: 2, name: 2 } as PlayingCard,
  { suit: "Diamonds", num: 3, name: 3 } as PlayingCard,
  { suit: "Diamonds", num: 4, name: 4 } as PlayingCard,
  { suit: "Diamonds", num: 5, name: 5 } as PlayingCard,
  { suit: "Diamonds", num: 6, name: 6 } as PlayingCard,
  { suit: "Diamonds", num: 7, name: 7 } as PlayingCard,
  { suit: "Diamonds", num: 8, name: 8 } as PlayingCard,
  { suit: "Diamonds", num: 9, name: 9 } as PlayingCard,
  { suit: "Diamonds", num: 10, name: 10 } as PlayingCard,
  { suit: "Diamonds", num: 11, name: "Jack", points: 1 } as PlayingCard,
  { suit: "Diamonds", num: 12, name: "Queen", points: 2 } as PlayingCard,
  { suit: "Diamonds", num: 13, name: "King", points: 3 } as PlayingCard,
];
