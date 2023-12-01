<script setup lang="ts">
import { v4 } from 'uuid';
import { socket } from './socket';
import { useRoomsStore } from './stores/rooms';
import type { Player } from './types/Room';
import { generateUsername } from 'unique-username-generator';

const roomStore = useRoomsStore();

socket.off();

roomStore.bindEvents();

const createRoom = () => {
  const roomId = v4();
  const player: Player = { teamIndex: 0, id: v4(), roomId, name: generateUsername(), hand: []  };
  roomStore.createRoom(roomId, player);
}

</script>

<template>
  <button @click="createRoom">Test</button>
</template>

<style scoped>
</style>
