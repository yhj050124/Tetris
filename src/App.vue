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
  background-color: #242424;
}
</style>
