<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { GAME_CONFIG } from '../constants/gameConstants';
import type { TetrisPiece, GameBoard as GameBoardType } from '../types/tetris';
import { generateRandomPiece, checkCollision, createEmptyBoard, calculateGameSpeed } from '../utils/tetrisUtils';
import { mergePiece, findLinesToClear, removeLines, calculateScore, rotateWithWallKick, hardDrop } from '../services/tetrisGameService';

// 导入子组件
import NextPiecePreview from './NextPiecePreview.vue';
import GameBoard from './GameBoard.vue';
import ScoreDisplay from './ScoreDisplay.vue';
import ControlButtons from './ControlButtons.vue';

// 使用ref跟踪窗口宽度
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 768);

// 创建一个resize处理函数的引用
const handleResize = () => {
    if (typeof window !== 'undefined') {
        windowWidth.value = window.innerWidth;
    }
};

const blockSize = computed(() => {
    return windowWidth.value < 768 ? 20 : GAME_CONFIG.BASE_BLOCK_SIZE;
});

// 游戏状态
const gameBoard = ref<GameBoardType>(createEmptyBoard());
const score = ref(0);
const isGameOver = ref(false);
const isPaused = ref(false);
const isPlaying = ref(false);
// 添加gameLoop变量，requestAnimationFrame返回一个数字ID
let gameLoopInterval: number | null = null;
// 添加下一个方块预览
const nextPiece = ref<TetrisPiece | null>(null);
// 添加最高分记录
const highScore = ref(localStorage.getItem('tetrisHighScore') ? parseInt(localStorage.getItem('tetrisHighScore') || '0') : 0);
// 添加游戏级别
const level = computed(() => Math.floor(score.value / 500) + 1);
// 添加消除动画状态
const linesToClear = ref<number[]>([]);
const isClearing = ref(false);
const clearAnimationFrame = ref(0);

// 当前方块的状态
const currentPiece = ref<TetrisPiece | null>(null);

// 触摸控制相关变量
let touchStartX = 0;
let touchStartY = 0;
let lastTouchTime = 0;

// 生成新方块
const generateNewPiece = () => {
    if (nextPiece.value) {
        currentPiece.value = nextPiece.value;
        // 重置位置
        currentPiece.value.x = Math.floor(GAME_CONFIG.BOARD_WIDTH / 2) - Math.floor(currentPiece.value.shape[0].length / 2);
        currentPiece.value.y = 0;
    } else {
        currentPiece.value = generateRandomPiece();
    }
    nextPiece.value = generateRandomPiece();
};

// 快速下落
const dropPiece = () => {
    if (!currentPiece.value || isPaused.value) return;

    const droppedPiece = hardDrop(currentPiece.value, gameBoard.value);
    if (droppedPiece) {
        currentPiece.value = droppedPiece;
        gameBoard.value = mergePiece(gameBoard.value, currentPiece.value);
        handleLineClearing();
        generateNewPiece();

        if (checkCollision(currentPiece.value, gameBoard.value)) {
            isGameOver.value = true;
        }
    }
};

// 处理行消除
const handleLineClearing = () => {
    const lines = findLinesToClear(gameBoard.value);
    if (lines.length > 0) {
        // 设置动画状态
        linesToClear.value = lines;
        isClearing.value = true;
        clearAnimationFrame.value = 0;

        // 计算分数
        const points = calculateScore(lines.length);
        score.value += points;

        // 更新最高分
        if (score.value > highScore.value) {
            highScore.value = score.value;
            localStorage.setItem('tetrisHighScore', highScore.value.toString());
        }

        return true;
    }
    return false;
};

// 执行行消除动画
const performClearAnimation = () => {
    if (!isClearing.value) return false;

    clearAnimationFrame.value++;

    if (clearAnimationFrame.value >= GAME_CONFIG.CLEAR_ANIMATION_FRAMES) {
        // 动画结束，实际移除行
        gameBoard.value = removeLines(gameBoard.value, linesToClear.value);

        // 重置动画状态
        isClearing.value = false;
        linesToClear.value = [];
        clearAnimationFrame.value = 0;

        // 生成新方块
        generateNewPiece();

        // 检查游戏结束
        if (checkCollision(currentPiece.value, gameBoard.value)) {
            isGameOver.value = true;
            isPlaying.value = false;
            return false;
        }

        return false;
    }

    return true; // 动画仍在进行中
};

// 移动方块
const movePiece = (dx: number) => {
    if (!currentPiece.value || isPaused.value) return;

    if (!checkCollision(currentPiece.value, gameBoard.value, dx, 0)) {
        currentPiece.value.x += dx;
    }
};

// 旋转方块
const rotatePiece = () => {
    if (!currentPiece.value || isPaused.value) return;
    currentPiece.value = rotateWithWallKick(currentPiece.value, gameBoard.value);
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
            if (!checkCollision(currentPiece.value, gameBoard.value, 0, 1)) {
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
        if (!checkCollision(currentPiece.value, gameBoard.value, 0, 1)) {
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
    gameBoard.value = createEmptyBoard();
    nextPiece.value = generateRandomPiece();
    generateNewPiece();

    // 重置动画状态
    isClearing.value = false;
    linesToClear.value = [];
    clearAnimationFrame.value = 0;

    if (gameLoopInterval) {
        cancelAnimationFrame(gameLoopInterval);
        gameLoopInterval = null;
    }

    let lastTime = 0;
    let deltaTime = 0;
    let currentSpeed = calculateGameSpeed(score.value);
    let animationFrameTime = 0;
    const ANIMATION_FRAME_DURATION = GAME_CONFIG.ANIMATION_FRAME_DURATION;

    const runGameLoop = (timestamp: number) => {
        if (!lastTime) lastTime = timestamp;
        const frameTime = timestamp - lastTime;
        lastTime = timestamp;

        // 如果游戏暂停，继续保持循环但不更新游戏状态
        if (isPaused.value) {
            gameLoopInterval = requestAnimationFrame(runGameLoop);
            return;
        }

        if (!isPlaying.value || isGameOver.value) {
            return;
        }

        // 处理消除动画
        if (isClearing.value) {
            animationFrameTime += frameTime;
            if (animationFrameTime >= ANIMATION_FRAME_DURATION) {
                animationFrameTime = 0;
                performClearAnimation();
            }
            gameLoopInterval = requestAnimationFrame(runGameLoop);
            return;
        }

        // 正常游戏逻辑
        deltaTime += frameTime;

        // 根据当前游戏速度更新游戏状态
        if (deltaTime >= currentSpeed) {
            // 重置累积时间
            deltaTime = 0;

            // 更新游戏速度
            currentSpeed = calculateGameSpeed(score.value);

            // 更新游戏状态
            if (currentPiece.value && !checkCollision(currentPiece.value, gameBoard.value, 0, 1)) {
                currentPiece.value.y++;
            } else {
                if (currentPiece.value) {
                    gameBoard.value = mergePiece(gameBoard.value, currentPiece.value);
                    // 如果有行需要清除，则开始动画，否则生成新方块
                    if (!handleLineClearing()) {
                        generateNewPiece();
                        if (checkCollision(currentPiece.value, gameBoard.value)) {
                            isGameOver.value = true;
                            isPlaying.value = false;
                            if (gameLoopInterval) {
                                cancelAnimationFrame(gameLoopInterval);
                                gameLoopInterval = null;
                            }
                            return;
                        }
                    }
                }
            }
        }

        // 继续游戏循环
        gameLoopInterval = requestAnimationFrame(runGameLoop);
    };

    // 启动游戏循环
    gameLoopInterval = requestAnimationFrame(runGameLoop);
    return gameLoopInterval;
};

// 暂停游戏
const pauseGame = () => {
    isPaused.value = !isPaused.value;
};

// 重置游戏
const resetGame = () => {
    if (gameLoopInterval) {
        cancelAnimationFrame(gameLoopInterval);
        gameLoopInterval = null;
    }
    startGame();
};

// 处理页面可见性变化
const handleVisibilityChange = () => {
    if (document.hidden && isPlaying.value && !isPaused.value && !isGameOver.value) {
        // 当页面不可见且游戏正在进行时自动暂停
        pauseGame();
    }
};

onMounted(() => {
    if (typeof window !== 'undefined') {
        window.addEventListener('resize', handleResize);
        window.addEventListener('keydown', handleKeydown);
        // 添加页面可见性变化监听
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // 添加触摸事件监听 - PC端游戏板
        const gameBoardEl = document.querySelector('.game-board');
        if (gameBoardEl) {
            gameBoardEl.addEventListener('touchstart', handleTouchStart as EventListener);
            gameBoardEl.addEventListener('touchmove', handleTouchMove as EventListener);
            gameBoardEl.addEventListener('touchend', handleTouchEnd as EventListener);
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
        // 移除页面可见性变化监听
        document.removeEventListener('visibilitychange', handleVisibilityChange);

        // 移除触摸事件监听 - PC端游戏板
        const gameBoardEl = document.querySelector('.game-board');
        if (gameBoardEl) {
            gameBoardEl.removeEventListener('touchstart', handleTouchStart as EventListener);
            gameBoardEl.removeEventListener('touchmove', handleTouchMove as EventListener);
            gameBoardEl.removeEventListener('touchend', handleTouchEnd as EventListener);
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
        cancelAnimationFrame(gameLoopInterval);
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
                <ScoreDisplay :score="score" :high-score="highScore" :level="level" />
                <NextPiecePreview :next-piece="nextPiece" :block-size="blockSize" />
                <ControlButtons :is-playing="isPlaying" :is-game-over="isGameOver" :is-paused="isPaused"
                    @start="startGame" @pause="pauseGame" @reset="resetGame" />
            </div>

            <!-- 中间游戏主体 -->
            <div class="center-panel">
                <GameBoard :game-board="gameBoard" :current-piece="currentPiece" :is-game-over="isGameOver"
                    :is-paused="isPaused" :is-clearing="isClearing" :lines-to-clear="linesToClear"
                    :clear-animation-frame="clearAnimationFrame" :block-size="blockSize" :score="score"
                    @pause="pauseGame" @reset="resetGame" />
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
                <ScoreDisplay :score="score" :high-score="highScore" :level="level" />

                <!-- 右侧下一个方块预览 -->
                <NextPiecePreview :next-piece="nextPiece" :block-size="blockSize" />
            </div>

            <!-- 控制按钮区域 -->
            <div class="mobile-controls-area">
                <ControlButtons :is-playing="isPlaying" :is-game-over="isGameOver" :is-paused="isPaused"
                    @start="startGame" @pause="pauseGame" @reset="resetGame" />
            </div>

            <!-- 游戏主体 -->
            <GameBoard :game-board="gameBoard" :current-piece="currentPiece" :is-game-over="isGameOver"
                :is-paused="isPaused" :is-clearing="isClearing" :lines-to-clear="linesToClear"
                :clear-animation-frame="clearAnimationFrame" :block-size="blockSize" :score="score" @pause="pauseGame"
                @reset="resetGame" class="mobile-game-board" />

            <!-- 移动端控制按钮 -->
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

.mobile-controls-area {
    display: flex;
    justify-content: center;
    gap: 10px;
    width: 100%;
    max-width: 400px;
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
}
</style>