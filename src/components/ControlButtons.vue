<script setup lang="ts">
defineProps<{
    isPlaying: boolean;
    isGameOver: boolean;
    isPaused: boolean;
}>();

const emit = defineEmits<{
    (e: 'start'): void;
    (e: 'pause'): void;
    (e: 'reset'): void;
}>();

const handleStart = () => {
    emit('start');
};

const handlePause = () => {
    emit('pause');
};

const handleReset = () => {
    emit('reset');
};
</script>

<template>
    <div class="controls">
        <button @click="handleStart" v-if="!isPlaying || isGameOver">开始游戏</button>
        <button @click="handlePause" v-else>{{ isPaused ? '继续' : '暂停' }}</button>
        <button @click="handleReset">重新开始</button>
    </div>
</template>

<style scoped>
.controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #333;
}

button {
    padding: 10px 20px;
    font-size: 1em;
    border: none;
    border-radius: 5px;
    background-color: #4CAF50;
    color: white;
    cursor: pointer;
    transition: background-color 0.3s;
}

button:hover {
    background-color: #45a049;
}

/* 移动端样式 */
@media (max-width: 768px) {
    .controls {
        flex-direction: column;
        gap: 5px;
        padding: 8px;
        height: 100%;
        justify-content: center;
        min-width: 100px;
    }

    button {
        padding: 8px;
        font-size: 0.9em;
        width: 100%;
        margin: 0;
    }
}

/* 小屏幕手机适配 */
@media (max-width: 375px) {
    button {
        padding: 6px;
        font-size: 0.8em;
    }
}
</style>