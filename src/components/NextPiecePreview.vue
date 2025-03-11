<script setup lang="ts">
import { computed } from 'vue';
import type { TetrisPiece } from '../types/tetris';

const props = defineProps<{
    nextPiece: TetrisPiece | null;
    blockSize: number;
}>();

// 渲染下一个方块预览
const previewBoard = computed(() => {
    if (!props.nextPiece) return [];

    const { shape, color } = props.nextPiece;
    const previewBoard = Array(4).fill(null).map(() => Array(4).fill(0));

    // 计算居中偏移
    const offsetX = Math.floor((4 - shape[0].length) / 2);
    const offsetY = Math.floor((4 - shape.length) / 2);

    shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                previewBoard[y + offsetY][x + offsetX] = { value: 1, color };
            }
        });
    });

    return previewBoard;
});
</script>

<template>
    <div class="next-piece-container">
        <div class="next-piece-title">下一个:</div>
        <div class="next-piece-preview" :style="{ width: `${blockSize * 4}px`, height: `${blockSize * 4}px` }">
            <template v-for="(row, y) in previewBoard" :key="y">
                <div v-for="(cell, x) in row" :key="`next-${x}-${y}`" class="preview-cell" :style="{
                    width: `${blockSize - 2}px`,
                    height: `${blockSize - 2}px`,
                    backgroundColor: cell ? cell.color : 'transparent',
                    border: cell ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.05)',
                    margin: '1px',
                    borderRadius: '2px'
                }">
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.next-piece-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #333;
}

.next-piece-title {
    margin-top: 0;
    margin-bottom: 10px;
    color: white;
    font-size: 1.2em;
    text-align: center;
}

.next-piece-preview {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(4, 1fr);
    gap: 1px;
}

.preview-cell {
    width: 20px;
    height: 20px;
    border: 1px solid #333;
    box-sizing: border-box;
}

.filled {
    border: 1px solid rgba(255, 255, 255, 0.3);
}

/* 移动端样式 */
@media (max-width: 768px) {
    .next-piece-container {
        padding: 10px;
    }

    .next-piece-title {
        margin-bottom: 5px;
        font-size: 1em;
    }

    .preview-cell {
        width: 15px;
        height: 15px;
    }
}
</style>