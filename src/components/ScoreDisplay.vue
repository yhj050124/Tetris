<script setup lang="ts">
defineProps<{
    score: number;
    highScore: number;
    level: number;
}>();
</script>

<template>
    <div class="score-container">
        <div class="score">分数: {{ score }}</div>
        <div class="high-score">最高分: {{ highScore }}</div>
        <div class="level">级别: {{ level }}</div>
    </div>
</template>

<style scoped>
.score-container {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 120px;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #333;
}

.score,
.high-score,
.level {
    font-size: 1.2em;
    color: white;
    text-align: left;
}
</style>