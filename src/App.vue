<script setup lang="ts">
import TetrisBoard from './components/TetrisBoard.vue'
</script>

<template>
  <div class="app-container">
    <TetrisBoard />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  background-color: #242424;
  overflow-x: hidden;
}
</style>
