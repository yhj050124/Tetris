<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// 定义游戏板大小
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;

// 游戏状态
const gameBoard = ref<Array<Array<{ value: number; color: string } | 0>>>(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0)));
const score = ref(0);
const isGameOver = ref(false);
const isPaused = ref(false);

interface TetrisPiece {
    shape: number[][];
    x: number;
    y: number;
    color: string;
}

// 当前方块的状态
const currentPiece = ref<TetrisPiece | null>(null);

// 定义俄罗斯方块的形状
const TETROMINOES = [
    {
        shape: [[1, 1, 1, 1]], // I
        color: '#00f0f0'
    },
    {
        shape: [[1, 1], [1, 1]], // O
        color: '#f0f000'
    },
    {
        shape: [[0, 1, 0], [1, 1, 1]], // T
        color: '#a000f0'
    },
    {
        shape: [[1, 0], [1, 0], [1, 1]], // L
        color: '#f0a000'
    },
    {
        shape: [[0, 1], [0, 1], [1, 1]], // J
        color: '#0000f0'
    },
    {
        shape: [[1, 1, 0], [0, 1, 1]], // S
        color: '#00f000'
    },
    {
        shape: [[0, 1, 1], [1, 1, 0]], // Z
        color: '#f00000'
    }
];

// 生成新方块
const generateNewPiece = () => {
    const randomPiece = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
    currentPiece.value = {
        shape: randomPiece.shape,
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(randomPiece.shape[0].length / 2),
        y: 0,
        color: randomPiece.color
    };
};

// 检查碰撞
const checkCollision = (piece: TetrisPiece | null, offsetX = 0, offsetY = 0): boolean => {
    if (!piece || !piece.shape) return true;

    return piece.shape.some((row, y) =>
        row.some((value, x) => {
            if (!value) return false;
            const newX = piece.x + x + offsetX;
            const newY = piece.y + y + offsetY;
            return (
                newX < 0 ||
                newX >= BOARD_WIDTH ||
                newY >= BOARD_HEIGHT ||
                (newY >= 0 && gameBoard.value[newY][newX])
            );
        })
    );
};

// 合并方块到游戏板
const mergePiece = () => {
    const piece = currentPiece.value;
    if (!piece || !piece.shape) return;

    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const boardY = piece.y + y;
                const boardX = piece.x + x;
                if (boardY >= 0) {
                    gameBoard.value[boardY][boardX] = { value: 1, color: piece.color };
                }
            }
        });
    });
};

// 清除完整的行
const clearLines = () => {
    let linesCleared = 0;

    gameBoard.value.forEach((row, y) => {
        if (row.every(cell => cell !== 0)) {
            gameBoard.value.splice(y, 1);
            gameBoard.value.unshift(Array(BOARD_WIDTH).fill(0));
            linesCleared++;
        }
    });

    if (linesCleared > 0) {
        score.value += linesCleared * 100;
    }
};

// 移动方块
const movePiece = (dx: number) => {
    if (!currentPiece.value || isPaused.value) return;

    if (!checkCollision(currentPiece.value, dx, 0)) {
        currentPiece.value.x += dx;
    }
};

// 旋转方块
const rotatePiece = () => {
    if (!currentPiece.value || isPaused.value) return;

    const rotated = {
        ...currentPiece.value,
        shape: currentPiece.value.shape[0].map((_, i) =>
            currentPiece.value!.shape.map(row => row[i]).reverse()
        )
    };

    if (!checkCollision(rotated)) {
        currentPiece.value = rotated;
    }
};

// 快速下落
const dropPiece = () => {
    if (!currentPiece.value || isPaused.value) return;

    while (!checkCollision(currentPiece.value, 0, 1)) {
        currentPiece.value.y++;
    }
    mergePiece();
    clearLines();
    generateNewPiece();

    if (checkCollision(currentPiece.value)) {
        isGameOver.value = true;
    }
};

// 游戏主循环
let gameLoop: ReturnType<typeof setInterval>;
const startGame = () => {
    isGameOver.value = false;
    isPaused.value = false;
    score.value = 0;
    gameBoard.value = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
    generateNewPiece();

    gameLoop = setInterval(() => {
        if (isPaused.value) return;

        if (currentPiece.value && !checkCollision(currentPiece.value, 0, 1)) {
            currentPiece.value.y++;
        } else {
            mergePiece();
            clearLines();
            generateNewPiece();

            if (checkCollision(currentPiece.value)) {
                isGameOver.value = true;
                clearInterval(gameLoop);
            }
        }
    }, 1000);
};

// 键盘控制
const handleKeydown = (event: KeyboardEvent) => {
    if (isGameOver.value) return;

    switch (event.key) {
        case 'ArrowLeft':
            movePiece(-1);
            break;
        case 'ArrowRight':
            movePiece(1);
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
        case 'ArrowDown':
            if (!checkCollision(currentPiece.value, 0, 1)) {
                currentPiece.value!.y++;
            }
            break;
        case ' ':
            dropPiece();
            break;
        case 'p':
            isPaused.value = !isPaused.value;
            break;
    }
};

onMounted(() => {
    startGame();
    window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
    clearInterval(gameLoop);
    window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
    <div class="tetris-container">
        <div class="game-info">
            <h2>俄罗斯方块</h2>
            <p>分数: {{ score }}</p>
            <button @click="startGame">重新开始</button>
            <button @click="isPaused = !isPaused" v-if="!isGameOver">{{ isPaused ? '继续' : '暂停' }}</button>
        </div>

        <div class="game-board" :style="{
                width: `${BOARD_WIDTH * BLOCK_SIZE}px`,
                height: `${BOARD_HEIGHT * BLOCK_SIZE}px`
            }">
            <!-- 游戏板背景 -->
            <div v-for="(row, y) in gameBoard" :key="y" class="board-row">
                <div v-for="(cell, x) in row" :key="`${x}-${y}`" class="board-cell" :style="{
                backgroundColor: typeof cell === 'object' ? cell.color : 'transparent',
                border: '2px solid rgba(51, 51, 51, 0.8)'
            }"></div>
            </div>

            <!-- 当前方块 -->
            <template v-if="currentPiece && !isGameOver">
                <div v-for="(row, y) in currentPiece.shape" :key="`piece-${y}`" class="piece-row" :style="{
                top: `${(currentPiece.y + y) * BLOCK_SIZE}px`,
                left: `${currentPiece.x * BLOCK_SIZE}px`
            }">
                    <div v-for="(cell, x) in row" :key="`piece-${x}-${y}`" class="piece-cell" :style="{
                backgroundColor: cell ? currentPiece.color : 'transparent',
                border: cell ? '2px solid rgba(255, 255, 255, 0.3)' : 'none'
            }"></div>
                </div>
            </template>

            <!-- 游戏结束遮罩 -->
            <div v-if="isGameOver" class="game-over">
                <h2>游戏结束</h2>
                <p>最终得分: {{ score }}</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.tetris-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 20px;
}

.game-info {
    text-align: center;
}

.game-info h2 {
    color: #42b883;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.game-info p {
    color: #ffd700;
    font-size: 1.2em;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
}
.game-board {
    position: relative;
    border: 2px solid #333;
    background-color: #1a1a1a;
    overflow: hidden;
}

.board-row {
    display: flex;
}

.board-cell {
    width: 30px;
    height: 30px;
    border: 1px solid #333;
    box-sizing: border-box;
}

.board-cell.filled {
    background-color: #666;
}

.piece-row {
    position: absolute;
    display: flex;
}

.piece-cell {
    width: 30px;
    height: 30px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-sizing: border-box;
}

.game-over {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
}

button {
    margin: 10px;
    padding: 8px 16px;
    font-size: 16px;
    cursor: pointer;
    background-color: #42b883;
    color: white;
    border: none;
    border-radius: 4px;
    transition: background-color 0.3s;
}

button:hover {
    background-color: #3aa876;
}
</style>