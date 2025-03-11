<script setup lang="ts">
defineProps<{
    score: number;
    highScore: number;
    level: number;
}>();
</script>

<template>
    <div class="score-container">
        <div class="score-item">
            <span class="label">分数:</span>
            <span class="value">{{ score }}</span>
        </div>
        <div class="score-item">
            <span class="label">最高分:</span>
            <span class="value">{{ highScore }}</span>
        </div>
        <div class="score-item">
            <span class="label">级别:</span>
            <span class="value">{{ level }}</span>
        </div>
    </div>
</template>

<style scoped>
.score-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 140px;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #333;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.score-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.label {
    font-size: 1.2em;
    color: #ccc;
}

.value {
    font-size: 1.2em;
    color: white;
    font-weight: bold;
}

/* 移动端样式 */
@media (max-width: 768px) {
    .score-container {
        padding: 10px;
        min-width: auto;
        gap: 5px;
    }

    .label,
    .value {
        font-size: 1em;
    }
}
</style>