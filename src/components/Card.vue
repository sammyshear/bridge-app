<template>
  <div v-if="props.cardType">
    <img :src="cardSrc" :alt="cardAlt" :class="cardClass">
  </div>
  <div v-if="!props.cardType">
    <img :src="CardBack" alt="Other player's card." :class="cardClass">
  </div>
</template>

<script setup lang="ts">
import type { PlayingCard } from '@/types/CardTypes';
import loadCard from "@/util/CardLoader";
import CardBack from "@/assets/Card back 01.svg";

  const props = defineProps<{
    cardType: boolean,
    card?: PlayingCard,
    cardHor: boolean;
  }>();

  const cardSrc = props.card ? loadCard(props.card) : CardBack;
  const cardClass = props.cardHor ? "horizontal-card" : "vertical-card";
  const cardAlt = `${props.card?.suit} of ${props.card?.name}`;
</script>

<style scoped lang="css">
.horizontal-card {
  width: 5vw;
}
.vertical-card {
  height: 5vw;
}
</style>
