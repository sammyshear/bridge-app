<script setup lang="ts">
import { v4 } from 'uuid';
import { socket } from './socket';
import { useRoomsStore } from './stores/rooms';
import type { Player } from './types/Room';
import { generateUsername } from 'unique-username-generator';
import { ref } from 'vue';

const roomStore = useRoomsStore();

socket.off();

roomStore.bindEvents();
const roomId = ref<string>("");
const teamIndex = ref<number>(0);
const picked = ref<"Connect" | "Create">("Connect");

const handleCreateConnect = () => {
  const player: Player = { teamIndex: teamIndex.value, id: v4(), roomId: roomId.value, name: generateUsername(), hand: []  };
  if (picked.value === "Connect") roomStore.connectToRoom(roomId.value, player);
  if (picked.value === "Create") roomStore.createRoom(roomId.value, player);
}

</script>

<template>
  <div class="modal" v-if="!roomStore.connected">
    <form @submit.prevent="handleCreateConnect" class="modal-content">
      <input type="text" v-model="roomId">
      <input type="range" :min="0" :max="1" v-model="teamIndex" id="teamRange">
      <label for="teamRange">Team: {{teamIndex}}</label>
      <input type="radio" id="connect" v-model="picked" value="Connect">
      <label for="connect">Connect</label>
      <input type="radio" id="create" v-model="picked" value="Create">
      <label for="create">Create</label>
      <button type="submit">{{picked}}</button>
    </form>
  </div>
  <div class="game" v-if="roomStore.connected">
    {{roomStore.curRoom?.id}}
  </div>

</template>

<style scoped>
</style>
