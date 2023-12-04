<template>
  <div v-if="props.cardType">
    <img :src="cardSrc" :alt="cardAlt" class="shown-card">
  </div>
  <div v-if="!props.cardType">
    <img :src="CardBack" alt="Other player's card." class="hidden-card">
  </div>
</template>

<script setup lang="ts">
import type { PlayingCard } from '@/types/CardTypes';
import loadCard from "@/util/CardLoader";
import CardBack from "@/assets/Card back 01.svg";

  const props = defineProps<{
    cardType: boolean,
    card: PlayingCard
  }>();

  const cardSrc = loadCard(props.card);
  const cardAlt = `${props.card.suit} of ${props.card.name}`;
</script>

<style scoped lang="css">
.shown-card {
  width: 5vw;
}
.hidden-card {
  height: 6vh;
}
</style>
