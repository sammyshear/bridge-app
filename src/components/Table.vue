<template>
  <div class="table">
    <div class="modal" v-if="isBidding && canBid">
      <form class="modal-content" @submit.prevent="handleBid">
        <select v-model="curSuit">
          <option disabled>Bid Suit</option>
          <option v-for="suit in suits">{{ suit }}</option>
        </select>
        <input type="number" v-model="curNum" />
        <button @click.prevent="handlePass">Pass</button>
        <button type="submit">Bid</button>
      </form>
    </div>
    <div class="modal" v-if="showRubberEnded">
      <form class="modal-content" @submit.prevent="handleVote">
        <h6>Rubber Ended</h6>
        Votes to Continue: {{continueVotes}}
        Votes to End: {{endVotes}}
        <input type="radio" v-model="picked" id="continue" value="Continue">
        <label for="continue">Continue</label>
        <input type="radio" v-model="picked" id="end" value="End">
        <label for="end">End</label>
        <button type="submit">Vote to {{picked}}</button>
      </form>
    </div>
    <div class="info">
      <table>
        <thead>
          <tr>
            <th>We</th>
            <th>They</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td v-if="score1">{{score1.aboveLine}}</td>
            <td v-if="score2">{{score2.aboveLine}}</td>
          </tr>
          <tr>
            <td v-if="score1">{{score1.belowLine}}</td>
            <td v-if="score2">{{score2.belowLine}}</td>
          </tr>
        </tbody>
      </table>
      <span v-if="curRoom?.currentTrump">Trump: {{ curRoom?.currentTrump }}</span>
      <br />
      <span v-if="curRoom?.currentBid">Bid: {{ curRoom?.currentBid?.num }}</span>
      <br />
      <span v-if="curRoom?.playingTeam?.tricksWon">Tricks Won: {{ curRoom?.playingTeam?.tricksWon }}</span>
      <br />
    </div>
    <div class="played-cards">
      <Card v-for="card in curTrick" :card="card.card" :key="card.card.name + card.card.suit" :card-type="true"
        :card-hor="true" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoomsStore } from "@/stores/rooms";
import type { Bid, PlayedCard, TrumpSuit } from "@/types/CardTypes";
import Card from "./Card.vue";
import { storeToRefs } from "pinia";
import { ref, watch } from "vue";
import type { Score } from "@/types/Room";

const store = useRoomsStore();
const { curRoom, player, showRubberEnded, continueVotes, endVotes } = storeToRefs(store);
const curSuit = ref<TrumpSuit>();
const curNum = ref<number>(1);
const curTrick = ref<PlayedCard[]>([]);
const score1 = ref<Score>();
const score2 = ref<Score>();
const picked = ref<"Continue" | "End">("Continue");

const suits: TrumpSuit[] = ["Spades", "Hearts", "Diamonds", "Clubs", "NoTrump"];

const canBid = ref<boolean>(curRoom.value!.playerWithBid?.id === player.value!.id);
const isBidding = ref<boolean>(curRoom.value?.currentBid === undefined);

const handleBid = () => {
  let bid: Bid = { suit: curSuit.value!, num: curNum.value! };
  store.bid(bid);
};

const handlePass = () => {
  store.sendPass();
};

const handleVote = () => {
  if (picked.value === "End") {
    store.voteEnd();
  } else {
    store.voteContinue()
  }
}

watch(curRoom, (newRoom, _) => {
  canBid.value = newRoom!.playerWithBid?.id === player.value!.id;
  if (newRoom?.numPassed === undefined) newRoom!.numPassed = 0;
  isBidding.value = newRoom?.numPassed! < 4;
  if (newRoom?.currentTrick !== undefined) curTrick.value = newRoom.currentTrick;
  score1.value = newRoom?.teams[player.value!.teamIndex].score;
  score2.value = newRoom?.teams[player.value!.teamIndex === 0 ? 1 : 0].score;
});
</script>

<style scoped lang="css">
.table {
  grid-row: 2;
  grid-column: 2;
}

.modal {
  position: fixed;
  z-index: 1;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.5);
}

.played-cards {
  display: flex;
  flex-direction: row;
}

.modal-content {
  background-color: #fefefe;
  margin: 15% auto;
  padding: 20px;
  border: 1px solid #888;
  width: 80%;
}
</style>
