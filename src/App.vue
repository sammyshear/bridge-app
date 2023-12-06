<script setup lang="ts">
import { v4 } from "uuid";
import { socket } from "./socket";
import { useRoomsStore } from "./stores/rooms";
import type { Player } from "./types/Room";
import { generateUsername } from "unique-username-generator";
import { ref, watch } from "vue";
import Hand from "./components/Hand.vue";
import Table from "./components/Table.vue";
import { storeToRefs } from "pinia";

const roomStore = useRoomsStore();
const { curRoom, player, connected, hand } = storeToRefs(roomStore);

socket.off();

roomStore.bindEvents();
const roomId = ref<string>("");
const teamIndex = ref<number>(0);
const picked = ref<"Connect" | "Create">("Connect");
const partnerHand = ref<Array<any>>(Array(13));
const opponentHand1 = ref<Array<any>>(Array(13));
const opponentHand2 = ref<Array<any>>(Array(13));

const partnerIsDummy = ref<boolean>(false);
const opponent1IsDummy = ref<boolean>(false);
const opponent2IsDummy = ref<boolean>(false);

watch(curRoom, (newRoom, _) => {
  player.value!.hand = newRoom!.teams[player.value!.teamIndex].players.find((p: Player) => p.id === player.value!.id)!.hand;
  hand.value = player.value!.hand;
  const partner = newRoom!.teams[player.value!.teamIndex].players.find(
    (p: Player) => p.id !== player.value!.id
  );
  const dummy = newRoom!.dummy;
  if (partner !== undefined && partner!.hand.length !== partnerHand.value.length) {
    partnerHand.value!.length = partner!.hand.length;
  }
  if (partner !== undefined && dummy !== undefined && partner.id === dummy.id) {
    partnerIsDummy.value = true;
    partnerHand.value = partner.hand;
  }
  const opponent1 =
    newRoom!.teams[player.value!.teamIndex === 0 ? 1 : 0]?.players[
    newRoom!.teams[player.value!.teamIndex].players.findIndex(
      (p: Player) => p.id !== player.value!.id
    )
    ];
  const opponent2 =
    newRoom!.teams[player.value!.teamIndex === 0 ? 1 : 0]?.players[
    newRoom!.teams[player.value!.teamIndex].players.findIndex(
      (p: Player) => p.id === player.value!.id
    )
    ];

  if (opponent1 !== undefined && opponent1.hand.length !== opponentHand1.value.length) {
    opponentHand1.value.length = opponent1.hand.length;
  }
  if (opponent1 !== undefined && dummy !== undefined && opponent1.id === dummy.id) {
    opponent1IsDummy.value = true;
    opponentHand1.value = opponent1.hand;
  }
  if (opponent2 !== undefined && opponent2.hand.length !== opponentHand2.value.length) {
    opponentHand2.value.length = opponent2.hand.length;
  }
  if (opponent2 !== undefined && dummy !== undefined && opponent2.id === dummy.id) {
    opponent2IsDummy.value = true;
    opponentHand2.value = opponent2.hand;
  }
  if (dummy === undefined) {
    opponent2IsDummy.value = false;
    opponent1IsDummy.value = false;
    partnerIsDummy.value = false;
  }
});

const handleCreateConnect = () => {
  const player: Player = {
    teamIndex: teamIndex.value,
    id: v4(),
    roomId: roomId.value,
    name: generateUsername(),
    hand: []
  };
  if (picked.value === "Connect") roomStore.connectToRoom(roomId.value, player);
  if (picked.value === "Create") roomStore.createRoom(roomId.value, player);
};
</script>

<template>
  <div class="modal" v-if="!connected">
    <form @submit.prevent="handleCreateConnect" class="modal-content">
      <input type="text" v-model="roomId" />
      <input type="number" :min="0" :max="1" v-model="teamIndex" id="teamRange" />
      <label for="teamRange">Team: {{ teamIndex }}</label>
      <input type="radio" id="connect" v-model="picked" value="Connect" />
      <label for="connect">Connect</label>
      <input type="radio" id="create" v-model="picked" value="Create" />
      <label for="create">Create</label>
      <button type="submit">{{ picked }}</button>
    </form>
  </div>
  <div class="game" v-if="connected">
    <Hand hand-type="partner" :hand="partnerHand" v-if="!partnerIsDummy" />
    <Hand hand-type="dummy-partner" :hand="partnerHand" v-if="partnerIsDummy" />
    <Hand hand-type="opponent" :hand="opponentHand1" v-if="!opponent1IsDummy" />
    <Hand hand-type="dummy-opponent" :hand="opponentHand1" v-if="opponent1IsDummy" />
    <Table />
    <Hand hand-type="player" :hand="hand" />
    <Hand hand-type="opponent" :hand="opponentHand2" v-if="!opponent2IsDummy" />
    <Hand hand-type="dummy-opponent" :hand="opponentHand2" v-if="opponent2IsDummy" />
  </div>
</template>

<style scoped lang="css">
.game {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: 150px calc(100% - 300px) 150px;
  grid-template-columns: 200px calc(100% - 400px) 200px;
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

.modal-content {
  background-color: #fefefe;
  margin: 15% auto;
  padding: 20px;
  border: 1px solid #888;
  width: 80%;
}
</style>
