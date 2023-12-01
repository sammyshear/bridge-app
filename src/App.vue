<script setup lang="ts">
import { v4 } from 'uuid';
import { socket } from './socket';
import { useRoomsStore } from './stores/rooms';

const roomStore = useRoomsStore();

socket.off();

roomStore.bindEvents();

const createRoom = () => {
  roomStore.createRoom(v4());
}

</script>

<template>
  <button @click="createRoom">Test</button>
</template>

<style scoped>
</style>
