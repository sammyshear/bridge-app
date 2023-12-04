import type { Room } from "../types/Room";
import type { PlayingCard as PlayingCard } from "../types/CardTypes";
import { deck } from "../types/CardTypes";

export function shuffle<T>(array: Array<T>): Array<T> {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function chunkArray<T>(array: Array<T>, n: number): Array<T[]> {
  const ret: Array<T[]> = [];
  for (let i = 0; i < array.length; i += n) {
    ret.push(array.slice(i, i + n));
  }

  return ret;
}

export function dealHands(room: Room) {
  if (!room.handsDealt) {
    const shuffledDeck = shuffle(deck);
    const fullPlayers = room.teams[0].players.concat(room.teams[1].players);

    const hands: Array<PlayingCard[]> = chunkArray(shuffledDeck, 13);
    for (let i = 0; i < fullPlayers.length; i++) {
      fullPlayers[i].hand = hands[i];
    }
  
    const ret = chunkArray(fullPlayers, 2);

    room.teams[0].players = ret[0];
    room.teams[1].players = ret[1];
  }
}
