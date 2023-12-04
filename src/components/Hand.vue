<template>
  <div :class="handType">
    <Card v-for="card in props.hand" v-if="props.hand" :card="card" :card-type="true" />
  </div>
</template>

<script setup lang="ts">
import type { PlayingCard } from "@/types/CardTypes";
import Card from "./Card.vue";

const props = defineProps<{
  handType: "player" | "partner" | "dummy-partner" | "opponent" | "dummy-opponent";
  hand?: PlayingCard[];
}>();

const handType = `hand hand-${props.handType}`;
</script>

<style scoped lang="css">
.hand {
  display: flex;
  flex-direction: row;
  place-content: center;
}

.hand-opponent {
  rotate: 90deg;
}

.hand-dummy-opponent {
  rotate: 90deg;
}

</style>
