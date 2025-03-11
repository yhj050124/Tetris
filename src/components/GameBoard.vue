<script setup lang="ts">
import { computed } from 'vue';
import type { GameBoard, TetrisPiece } from '../types/tetris';
import { GAME_CONFIG } from '../constants/gameConstants';

const props = defineProps<{
    gameBoard: GameBoard;
    currentPiece: TetrisPiece | null;
    isGameOver: boolean;
    isPaused: boolean;
    isClearing: boolean;
    linesToClear: number[];
    clearAnimationFrame: number;
    blockSize: number;
    score: number;
}>();

const emit = defineEmits<{
    (e: 'pause'): void;
    (e: 'reset'): void;
}>();

// 渲染游戏板和当前方块
const renderBoard = computed(() => {
    const board = props.gameBoard.map(row => [...row]);

    // 渲染当前方块
    if (props.currentPiece && !props.isGameOver && !props.isClearing) {
        const { shape, x, y, color } = props.currentPiece;
        shape.forEach((row, pieceY) => {
            row.forEach((value, pieceX) => {
                if (value && y + pieceY >= 0) {
                    const boardY = y + pieceY;
                    const boardX = x + pieceX;
                    if (boardY < GAME_CONFIG.BOARD_HEIGHT && boardX < GAME_CONFIG.BOARD_WIDTH) {
                        board[boardY][boardX] = { value: 1, color };
                    }
                }
            });
        });
    }

    // 渲染消除动画
    if (props.isClearing && props.linesToClear.length > 0) {
        const animationProgress = props.clearAnimationFrame / GAME_CONFIG.CLEAR_ANIMATION_FRAMES;

        props.linesToClear.forEach(lineY => {
            for (let x = 0; x < GAME_CONFIG.BOARD_WIDTH; x++) {
                // 根据动画进度计算闪烁效果，减少闪烁次数
                const isVisible = Math.floor(animationProgress * 3) % 2 === 0;

                if (isVisible) {
                    // 闪烁时显示白色
                    board[lineY][x] = { value: 1, color: '#FFFFFF' };
                } else {
                    // 闪烁时隐藏
                    board[lineY][x] = 0;
                }
            }
        });
    }

    return board;
});
</script>

<template>
    <div class="game-board-container">
        <div class="game-board"
            :style="{ width: `${GAME_CONFIG.BOARD_WIDTH * blockSize}px`, height: `${GAME_CONFIG.BOARD_HEIGHT * blockSize}px` }">
            <template v-for="(row, y) in renderBoard" :key="y">
                <div v-for="(cell, x) in row" :key="`${x}-${y}`" class="cell" :style="{
                    width: `${blockSize - 2}px`,
                    height: `${blockSize - 2}px`,
                    backgroundColor: cell ? cell.color : 'transparent',
                    border: cell ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.05)',
                    margin: '1px'
                }">
                </div>
            </template>
            <div v-if="isGameOver" class="game-over-overlay">
                <h2>游戏结束</h2>
                <div>最终分数: {{ score }}</div>
                <button class="restart-button" @click="emit('reset')">重新开始</button>
            </div>
            <div v-if="isPaused && !isGameOver" class="pause-overlay">
                <h2>游戏暂停</h2>
                <button class="resume-button" @click="emit('pause')">继续游戏</button>
            </div>
            <button v-if="!isGameOver" class="pause-button" @click="emit('pause')">
                <span class="pause-icon"></span>
            </button>
        </div>
    </div>
</template>

<style scoped>
.game-board-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.game-board {
    display: grid;
    grid-template-columns: repeat(v-bind('GAME_CONFIG.BOARD_WIDTH'), 1fr);
    background-color: rgba(0, 0, 0, 0.5);
    border: 2px solid #333;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    gap: 0;
    padding: 0;
    position: relative;
}

.cell {
    box-sizing: border-box;
    transition: background-color 0.2s;
    border-radius: 2px;
}

.clearing {
    animation: flash 0.2s infinite alternate;
}

@keyframes flash {
    from {
        opacity: 1;
    }

    to {
        opacity: 0.3;
    }
}

.game-over-overlay,
.pause-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    font-size: 1.5em;
    z-index: 10;
}

.game-over-overlay h2,
.pause-overlay h2 {
    margin-bottom: 20px;
    margin-top: 0;
}

.restart-button,
.resume-button {
    margin-top: 15px;
    padding: 8px 16px;
    font-size: 0.8em;
    border: none;
    border-radius: 5px;
    background-color: #4CAF50;
    color: white;
    cursor: pointer;
}

.restart-button:hover,
.resume-button:hover {
    background-color: #45a049;
}

.pause-button {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
    z-index: 5;
    border: 1px solid rgba(255, 255, 255, 0.2);
    cursor: pointer;
}

.pause-icon {
    display: inline-block;
    width: 16px;
    height: 16px;
    position: relative;
}

.pause-icon::before,
.pause-icon::after {
    content: '';
    position: absolute;
    width: 5px;
    height: 16px;
    background-color: white;
    border-radius: 2px;
}

.pause-icon::before {
    left: 2px;
}

.pause-icon::after {
    right: 2px;
}

/* PC端样式优化 */
@media (min-width: 769px) {
    .game-board {
        border-width: 1px;
    }

    .cell {
        border-width: 1px;
    }

    .game-over-overlay h2,
    .pause-overlay h2 {
        font-size: 1.2em;
        margin-bottom: 15px;
    }
}
</style>