<template>
  <div :class="handType">
    <Card v-if="shown && props.hand" v-for="card in props.hand" :card="card" :key="card.name + card.suit" :card-type="true" :card-hor="horizontal" @click="handleClick(card)" />
    <Card v-if="!shown && props.hand" v-for="card, i in props.hand" :key="i + 'hidden'" :card-type="false" :card="card" :card-hor="horizontal"/>
  </div>
</template>

<script setup lang="ts">
import type { PlayingCard } from "@/types/CardTypes";
import Card from "./Card.vue";
import { ref, watch } from "vue";
import { useRoomsStore } from "@/stores/rooms";
import { storeToRefs } from "pinia";

const props = defineProps<{
  handType: "player" | "partner" | "dummy-partner" | "opponent" | "dummy-opponent";
  hand?: PlayingCard[];
}>();

const store = useRoomsStore();
const { curRoom, player } = storeToRefs(store);
const canPlay = ref<boolean>(curRoom.value!.playerWithTurn?.id === player.value!.id);

const horizontal = !props.handType.includes("opponent");
const handClasses = props.handType.includes("dummy") ? "hand-" + props.handType + " hand" + props.handType.replace("dummy", "") : "hand-" + props.handType;
const handType = `hand ${handClasses}`;
const shown = ref<boolean>(props.handType === "player" || props.handType === "dummy-partner" || props.handType === "dummy-opponent");

watch(curRoom, (newRoom, _) => {
  canPlay.value = newRoom?.playerWithTurn?.id === player.value!.id;
});

const handleClick = (card: PlayingCard) => {
  if (props.handType !== "player") return;
  if (!canPlay.value) return;
  store.playCard(card);
};
</script>

<style scoped lang="css">
.hand {
  display: flex;
  flex-direction: row;
  place-self: center;
  place-content: center;
}

.hand-partner {
  grid-column: 2;
  grid-row: 1;
}

.hand-player {
  grid-row: 3;
  grid-column: 2;
}

.hand-opponent {
  rotate: 90deg;
  height: 150px;
  grid-row: 2;
  grid-column: 1;
}

.hand-opponent:last-of-type {
  rotate: 270deg;
  grid-row: 2;
  grid-column: 3;
}
</style>
