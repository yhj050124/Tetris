<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';

// 定义游戏板大小
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BASE_BLOCK_SIZE = 30;

// 使用ref跟踪窗口宽度
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 768);

// 创建一个resize处理函数的引用
const handleResize = () => {
    if (typeof window !== 'undefined') {
        windowWidth.value = window.innerWidth;
    }
};

const blockSize = computed(() => {
    return windowWidth.value < 768 ? 20 : BASE_BLOCK_SIZE;
});

// 计算游戏板实际尺寸
const boardWidth = computed(() => BOARD_WIDTH * Number(blockSize.value));
const boardHeight = computed(() => BOARD_HEIGHT * Number(blockSize.value));

// 游戏状态
const gameBoard = ref<Array<Array<{ value: number; color: string } | 0>>>(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0)));
const score = ref(0);
const isGameOver = ref(false);
const isPaused = ref(false);
const isPlaying = ref(false);
// 添加gameLoop变量
let gameLoopInterval: number | null = null;
// 添加下一个方块预览
const nextPiece = ref<TetrisPiece | null>(null);
// 添加最高分记录
const highScore = ref(localStorage.getItem('tetrisHighScore') ? parseInt(localStorage.getItem('tetrisHighScore') || '0') : 0);
// 添加游戏级别
const level = computed(() => Math.floor(score.value / 500) + 1);

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

// 生成随机方块
const generateRandomPiece = (): TetrisPiece => {
    const randomPiece = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
    return {
        shape: JSON.parse(JSON.stringify(randomPiece.shape)), // 深拷贝形状
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(randomPiece.shape[0].length / 2),
        y: 0,
        color: randomPiece.color
    };
};

// 生成新方块
const generateNewPiece = () => {
    if (nextPiece.value) {
        currentPiece.value = nextPiece.value;
        // 重置位置
        currentPiece.value.x = Math.floor(BOARD_WIDTH / 2) - Math.floor(currentPiece.value.shape[0].length / 2);
        currentPiece.value.y = 0;
    } else {
        currentPiece.value = generateRandomPiece();
    }
    nextPiece.value = generateRandomPiece();
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
    if (!currentPiece.value || !currentPiece.value.shape) return;

    const { shape, x, y, color } = currentPiece.value;
    shape.forEach((row, pieceY) => {
        row.forEach((value, pieceX) => {
            if (value) {
                const boardY = y + pieceY;
                const boardX = x + pieceX;
                if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                    gameBoard.value[boardY][boardX] = { value: 1, color };
                }
            }
        });
    });
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

// 清除完整的行
const clearLines = () => {
    let linesCleared = 0;

    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (gameBoard.value[y].every(cell => cell !== 0)) {
            // 删除完整的行
            gameBoard.value.splice(y, 1);
            // 在顶部添加新行
            gameBoard.value.unshift(Array(BOARD_WIDTH).fill(0));
            linesCleared++;
            // 由于我们删除了一行并添加了一行，需要重新检查当前行
            y++;
        }
    }

    if (linesCleared > 0) {
        // 根据消除的行数增加分数
        const points = [0, 100, 300, 500, 800]; // 0, 1, 2, 3, 4行的分数
        score.value += linesCleared <= 4 ? points[linesCleared] : linesCleared * 200;

        // 更新最高分
        if (score.value > highScore.value) {
            highScore.value = score.value;
            localStorage.setItem('tetrisHighScore', highScore.value.toString());
        }
    }
};

// 移动方块
const movePiece = (dx: number) => {
    if (!currentPiece.value || isPaused.value) return;

    if (!checkCollision(currentPiece.value, dx, 0)) {
        currentPiece.value.x += dx;
    }
};

// 渲染游戏板和当前方块
const renderBoard = () => {
    const board = gameBoard.value.map(row => [...row]);

    if (currentPiece.value && !isGameOver.value) {
        const { shape, x, y, color } = currentPiece.value;
        shape.forEach((row, pieceY) => {
            row.forEach((value, pieceX) => {
                if (value && y + pieceY >= 0) {
                    const boardY = y + pieceY;
                    const boardX = x + pieceX;
                    if (boardY < BOARD_HEIGHT && boardX < BOARD_WIDTH) {
                        board[boardY][boardX] = { value: 1, color };
                    }
                }
            });
        });
    }
    return board;
};

// 渲染下一个方块预览
const renderNextPiece = () => {
    if (!nextPiece.value) return [];

    const { shape, color } = nextPiece.value;
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
};

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
    if (isGameOver.value || !isPlaying.value) return;

    switch (event.key) {
        case 'ArrowLeft':
            movePiece(-1);
            break;
        case 'ArrowRight':
            movePiece(1);
            break;
        case 'ArrowDown':
            if (!checkCollision(currentPiece.value, 0, 1)) {
                currentPiece.value!.y++;
            }
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
        case ' ':
            dropPiece();
            break;
        case 'p':
        case 'P':
            pauseGame();
            break;
    }
};

// 旋转方块
const rotatePiece = () => {
    if (!currentPiece.value || isPaused.value) return;

    const { shape } = currentPiece.value;
    const newShape = shape[0].map((_, i) => shape.map(row => row[i]).reverse());
    const oldShape = currentPiece.value.shape;
    currentPiece.value.shape = newShape;

    // 墙踢算法：如果旋转后碰撞，尝试左右移动来适应
    if (checkCollision(currentPiece.value)) {
        // 尝试向左移动
        for (let offset = 1; offset <= 2; offset++) {
            currentPiece.value.x -= offset;
            if (!checkCollision(currentPiece.value)) {
                return; // 找到有效位置
            }
            currentPiece.value.x += offset; // 恢复位置
        }

        // 尝试向右移动
        for (let offset = 1; offset <= 2; offset++) {
            currentPiece.value.x += offset;
            if (!checkCollision(currentPiece.value)) {
                return; // 找到有效位置
            }
            currentPiece.value.x -= offset; // 恢复位置
        }

        // 如果都不行，恢复原来的形状
        currentPiece.value.shape = oldShape;
    }
};

// 触摸控制相关变量
let touchStartX = 0;
let touchStartY = 0;
let lastTouchTime = 0;

// 处理触摸开始
const handleTouchStart = (event: Event) => {
    if (isGameOver.value || !isPlaying.value || isPaused.value) return;

    const touchEvent = event as TouchEvent;
    touchStartX = touchEvent.touches[0].clientX;
    touchStartY = touchEvent.touches[0].clientY;
    lastTouchTime = Date.now();
};

// 处理触摸移动
const handleTouchMove = (event: Event) => {
    if (isGameOver.value || !isPlaying.value || isPaused.value) return;

    const touchEvent = event as TouchEvent;
    const touchX = touchEvent.touches[0].clientX;
    const touchY = touchEvent.touches[0].clientY;
    const diffX = touchX - touchStartX;
    const diffY = touchY - touchStartY;
    const currentTime = Date.now();

    // 防止过于频繁的移动
    if (currentTime - lastTouchTime < 100) return;

    // 水平滑动 - 左右移动
    if (Math.abs(diffX) > 30 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
            movePiece(1); // 右移
        } else {
            movePiece(-1); // 左移
        }
        touchStartX = touchX;
        lastTouchTime = currentTime;
    }

    // 垂直滑动 - 加速下落
    if (diffY > 50 && Math.abs(diffY) > Math.abs(diffX)) {
        if (!checkCollision(currentPiece.value, 0, 1)) {
            currentPiece.value!.y++;
        }
        touchStartY = touchY;
        lastTouchTime = currentTime;
    }
};

// 处理触摸结束
const handleTouchEnd = (event: Event) => {
    if (isGameOver.value || !isPlaying.value || isPaused.value) return;

    const touchEvent = event as TouchEvent;
    const touchEndX = touchEvent.changedTouches[0].clientX;
    const touchEndY = touchEvent.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    // 快速点击 - 旋转
    if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10 && (Date.now() - lastTouchTime < 300)) {
        rotatePiece();
    }

    // 快速下滑 - 硬降
    if (diffY > 100 && Math.abs(diffY) > Math.abs(diffX) * 2) {
        dropPiece();
    }
};

// 游戏主循环
const startGame = () => {
    isGameOver.value = false;
    isPaused.value = false;
    isPlaying.value = true;
    score.value = 0;
    gameBoard.value = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
    nextPiece.value = generateRandomPiece();
    generateNewPiece();

    if (gameLoopInterval) {
        clearInterval(gameLoopInterval);
        clearTimeout(gameLoopInterval);
        gameLoopInterval = null;
    }

    // 游戏速度会随着分数增加而加快
    const getGameSpeed = () => {
        const baseSpeed = 1000; // 基础速度1秒
        const minSpeed = 100;   // 最小速度100毫秒
        const speedFactor = Math.floor(score.value / 500); // 每500分加快一次
        return Math.max(minSpeed, baseSpeed - speedFactor * 100);
    };

    const runGameLoop = () => {
        if (isPaused.value) {
            // 如果游戏暂停，继续保持循环但不更新游戏状态
            gameLoopInterval = window.setTimeout(runGameLoop, 100);
            return;
        }

        if (!isPlaying.value || isGameOver.value) {
            return;
        }

        if (currentPiece.value && !checkCollision(currentPiece.value, 0, 1)) {
            currentPiece.value.y++;
        } else {
            if (currentPiece.value) {
                mergePiece();
                clearLines();
                generateNewPiece();

                if (checkCollision(currentPiece.value)) {
                    isGameOver.value = true;
                    isPlaying.value = false;
                    if (gameLoopInterval) {
                        clearTimeout(gameLoopInterval);
                        gameLoopInterval = null;
                    }
                    return;
                }
            }
        }

        // 根据当前分数调整游戏速度
        if (gameLoopInterval) {
            clearTimeout(gameLoopInterval);
        }
        gameLoopInterval = window.setTimeout(runGameLoop, getGameSpeed());
    };

    // 启动游戏循环
    gameLoopInterval = window.setTimeout(runGameLoop, getGameSpeed());
    return gameLoopInterval;
};

// 暂停游戏
const pauseGame = () => {
    isPaused.value = !isPaused.value;
};

// 重置游戏
const resetGame = () => {
    if (gameLoopInterval) {
        clearTimeout(gameLoopInterval);
        clearInterval(gameLoopInterval);
        gameLoopInterval = null;
    }
    startGame();
};

onMounted(() => {
    if (typeof window !== 'undefined') {
        window.addEventListener('resize', handleResize);
        window.addEventListener('keydown', handleKeydown);

        // 添加触摸事件监听 - PC端游戏板
        const gameBoard = document.querySelector('.game-board');
        if (gameBoard) {
            gameBoard.addEventListener('touchstart', handleTouchStart as EventListener);
            gameBoard.addEventListener('touchmove', handleTouchMove as EventListener);
            gameBoard.addEventListener('touchend', handleTouchEnd as EventListener);
        }

        // 添加触摸事件监听 - 移动端游戏板
        setTimeout(() => {
            const mobileGameBoard = document.querySelector('.mobile-game-board');
            if (mobileGameBoard) {
                mobileGameBoard.addEventListener('touchstart', handleTouchStart as EventListener);
                mobileGameBoard.addEventListener('touchmove', handleTouchMove as EventListener);
                mobileGameBoard.addEventListener('touchend', handleTouchEnd as EventListener);
            }
        }, 500); // 延迟添加事件监听，确保DOM已完全加载
    }

    // 确保游戏循环在组件挂载后启动
    setTimeout(() => {
        startGame();
    }, 100);
});

onUnmounted(() => {
    if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKeydown);

        // 移除触摸事件监听 - PC端游戏板
        const gameBoard = document.querySelector('.game-board');
        if (gameBoard) {
            gameBoard.removeEventListener('touchstart', handleTouchStart as EventListener);
            gameBoard.removeEventListener('touchmove', handleTouchMove as EventListener);
            gameBoard.removeEventListener('touchend', handleTouchEnd as EventListener);
        }

        // 移除触摸事件监听 - 移动端游戏板
        const mobileGameBoard = document.querySelector('.mobile-game-board');
        if (mobileGameBoard) {
            mobileGameBoard.removeEventListener('touchstart', handleTouchStart as EventListener);
            mobileGameBoard.removeEventListener('touchmove', handleTouchMove as EventListener);
            mobileGameBoard.removeEventListener('touchend', handleTouchEnd as EventListener);
        }
    }
    if (gameLoopInterval) {
        clearTimeout(gameLoopInterval);
        clearInterval(gameLoopInterval);
        gameLoopInterval = null;
    }
});
</script>

<template>
    <div class="tetris-container">
        <div class="game-header">
            <h1>俄罗斯方块</h1>
        </div>

        <!-- PC端布局 -->
        <div class="game-content desktop-layout">
            <!-- 左侧信息面板 -->
            <div class="left-panel">
                <div class="score-container">
                    <div class="score">分数: {{ score }}</div>
                    <div class="high-score">最高分: {{ highScore }}</div>
                    <div class="level">级别: {{ level }}</div>
                </div>
                <div class="next-piece-container">
                    <div class="next-piece-title">下一个:</div>
                    <div class="next-piece-preview"
                        :style="{ width: `${blockSize * 4}px`, height: `${blockSize * 4}px` }">
                        <template v-for="(row, y) in renderNextPiece()" :key="y">
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
                <div class="controls">
                    <button @click="startGame" v-if="!isPlaying || isGameOver">开始游戏</button>
                    <button @click="pauseGame" v-else>{{ isPaused ? '继续' : '暂停' }}</button>
                    <button @click="resetGame">重新开始</button>
                </div>
            </div>

            <!-- 中间游戏主体 -->
            <div class="center-panel">
                <div class="game-board" :style="{ width: `${boardWidth}px`, height: `${boardHeight}px` }">
                    <template v-for="(row, y) in renderBoard()" :key="y">
                        <div v-for="(cell, x) in row" :key="`${x}-${y}`" class="cell" :style="{
                            width: `${blockSize - 2}px`,
                            height: `${blockSize - 2}px`,
                            backgroundColor: cell ? cell.color : 'transparent',
                            border: cell ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.05)',
                            margin: '1px'
                        }">
                        </div>
                    </template>
                    <div v-if="isGameOver" class="game-over">
                        <div class="game-over-text">游戏结束</div>
                        <div class="final-score">最终分数: {{ score }}</div>
                        <button @click="resetGame">重新开始</button>
                    </div>
                    <div v-if="isPaused && !isGameOver" class="pause-overlay">
                        <div class="pause-text">已暂停</div>
                        <button @click="pauseGame">继续</button>
                    </div>
                    <!-- 添加暂停按钮 -->
                    <button v-if="isPlaying && !isPaused && !isGameOver" @click="pauseGame" class="pause-button">
                        <span class="pause-icon"></span>
                    </button>
                </div>
            </div>

            <!-- 右侧操作说明 -->
            <div class="right-panel">
                <div class="instructions">
                    <h3>操作说明:</h3>
                    <p>← → 键: 左右移动</p>
                    <p>↑ 键: 旋转</p>
                    <p>↓ 键: 加速下落</p>
                    <p>空格键: 快速下落</p>
                    <p>P 键: 暂停/继续</p>
                </div>
            </div>
        </div>

        <!-- 移动端布局 -->
        <div class="mobile-layout" v-if="windowWidth < 768">
            <!-- 上方信息区域 -->
            <div class="mobile-top-area">
                <!-- 左侧分数区域 -->
                <div class="mobile-score-area">
                    <div class="score">分数: {{ score }}</div>
                    <div class="high-score">最高分: {{ highScore }}</div>
                    <div class="level">级别: {{ level }}</div>
                </div>

                <!-- 右侧下一个方块预览 -->
                <div class="mobile-next-piece">
                    <div class="next-piece-title">下一个:</div>
                    <div class="next-piece-preview"
                        :style="{ width: `${blockSize * 4}px`, height: `${blockSize * 4}px` }">
                        <template v-for="(row, y) in renderNextPiece()" :key="y">
                            <div v-for="(cell, x) in row" :key="`mobile-next-${x}-${y}`" class="preview-cell" :style="{
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
            </div>

            <!-- 控制按钮区域 -->
            <div class="mobile-controls-area">
                <button @click="startGame" v-if="!isPlaying || isGameOver" class="control-btn">开始游戏</button>
                <button @click="pauseGame" v-else class="control-btn">{{ isPaused ? '继续' : '暂停' }}</button>
                <button @click="resetGame" class="control-btn">重新开始</button>
            </div>

            <!-- 游戏主体 -->
            <div class="mobile-game-board" :style="{ width: `${boardWidth}px`, height: `${boardHeight}px` }">
                <template v-for="(row, y) in renderBoard()" :key="y">
                    <div v-for="(cell, x) in row" :key="`mobile-${x}-${y}`" class="cell" :style="{
                        width: `${blockSize - 2}px`,
                        height: `${blockSize - 2}px`,
                        backgroundColor: cell ? cell.color : 'transparent',
                        border: cell ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.05)',
                        margin: '1px'
                    }">
                    </div>
                </template>
                <div v-if="isGameOver" class="game-over">
                    <div class="game-over-text">游戏结束</div>
                    <div class="final-score">最终分数: {{ score }}</div>
                    <button @click="resetGame">重新开始</button>
                </div>
                <div v-if="isPaused && !isGameOver" class="pause-overlay">
                    <div class="pause-text">已暂停</div>
                    <button @click="pauseGame">继续</button>
                </div>
                <!-- 添加暂停按钮 -->
                <button v-if="isPlaying && !isPaused && !isGameOver" @click="pauseGame" class="pause-button">
                    <span class="pause-icon"></span>
                </button>
            </div>

            <!-- 移动端控制按钮 - 放在游戏板下方 -->
            <div class="mobile-controls">
                <div class="control-row">
                    <button @click="rotatePiece" class="rotate-btn">旋转</button>
                </div>
                <div class="control-row">
                    <button @click="movePiece(-1)" class="move-btn">←</button>
                    <button @click="dropPiece" class="drop-btn">下降</button>
                    <button @click="movePiece(1)" class="move-btn">→</button>
                </div>
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
    background-color: #1a1a1a;
    min-height: 100vh;
    width: 100%;
    box-sizing: border-box;
}

.game-header h1 {
    color: #4CAF50;
    margin: 0 0 20px 0;
    text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
    text-align: center;
}

/* PC端布局样式 */
.game-content {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 20px;
    width: 100%;
    max-width: 1200px;
}

.left-panel,
.right-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 250px;
}

.center-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    gap: 10px;
}

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
    font-size: 1.2em;
    color: white;
    margin-bottom: 10px;
}

.next-piece-preview {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    background-color: rgba(0, 0, 0, 0.5);
    border: 1px solid #333;
    gap: 0;
    padding: 0;
}

.preview-cell {
    box-sizing: border-box;
}

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

.game-board,
.mobile-game-board {
    position: relative;
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    background-color: rgba(0, 0, 0, 0.8);
    border: 2px solid #333;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    gap: 0;
    padding: 0;
}

.cell {
    box-sizing: border-box;
    transition: background-color 0.2s;
    border-radius: 2px;
}

.game-over,
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
    background-color: rgba(0, 0, 0, 0.8);
    gap: 20px;
    z-index: 10;
}

.game-over-text,
.pause-text {
    color: white;
    font-size: 2em;
    text-align: center;
}

.final-score {
    color: #4CAF50;
    font-size: 1.5em;
}

/* 暂停按钮样式 */
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

.instructions {
    margin-top: 0;
    color: #aaa;
    text-align: left;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #333;
}

.instructions h3 {
    color: white;
    margin-bottom: 10px;
}

.instructions p {
    margin: 5px 0;
}

/* 移动端布局样式 */
.mobile-layout {
    display: none;
    flex-direction: column;
    align-items: center;
    width: 100%;
    gap: 15px;
}

.mobile-top-area {
    display: flex;
    justify-content: space-between;
    width: 100%;
    max-width: 400px;
    gap: 10px;
}

.mobile-score-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #333;
}

.mobile-next-piece {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #333;
}

.mobile-controls-area {
    display: flex;
    justify-content: center;
    gap: 10px;
    width: 100%;
    max-width: 400px;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #333;
}

.mobile-controls-area .control-btn {
    flex: 1;
    font-size: 0.9em;
    padding: 8px 5px;
}

.mobile-game-board {
    position: relative;
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    background-color: rgba(0, 0, 0, 0.8);
    border: 2px solid #333;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    margin: 5px 0;
}

.mobile-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    max-width: 300px;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #333;
    margin-top: 5px;
}

.control-row {
    display: flex;
    justify-content: center;
    gap: 8px;
}

.mobile-controls button {
    width: 50px;
    height: 50px;
    font-size: 1.2em;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
}

.mobile-controls .rotate-btn {
    width: 100%;
    background-color: #9c27b0;
}

.mobile-controls .rotate-btn:hover {
    background-color: #7b1fa2;
}

.mobile-controls .move-btn {
    background-color: #2196f3;
    flex: 1;
}

.mobile-controls .move-btn:hover {
    background-color: #1976d2;
}

.mobile-controls .drop-btn {
    background-color: #f44336;
    flex: 1;
}

.mobile-controls .drop-btn:hover {
    background-color: #d32f2f;
}

/* 响应式布局 */
@media (max-width: 1024px) {
    .desktop-layout {
        flex-direction: column;
        align-items: center;
    }

    .left-panel,
    .right-panel {
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
        max-width: 100%;
    }

    .score-container,
    .next-piece-container,
    .controls,
    .instructions {
        margin: 0 10px 10px 0;
    }
}

@media (max-width: 768px) {
    .tetris-container {
        padding: 10px;
    }

    .game-header h1 {
        font-size: 1.5em;
        margin-bottom: 10px;
    }

    .desktop-layout {
        display: none;
    }

    .mobile-layout {
        display: flex;
    }

    .pause-button {
        width: 30px;
        height: 30px;
    }

    .pause-icon {
        width: 12px;
        height: 12px;
    }

    .pause-icon::before,
    .pause-icon::after {
        width: 4px;
        height: 12px;
    }
}
</style>