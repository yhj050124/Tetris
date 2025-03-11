<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { gameStateService } from '../services/gameStateService';
import { GAME_CONFIG } from '../constants/gameConstants';

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

// 计算方块大小
const blockSize = ref(windowWidth.value < 768 ? 20 : GAME_CONFIG.BASE_BLOCK_SIZE);

// 从游戏状态服务中解构需要的状态和方法
const {
    gameBoard,
    score,
    isGameOver,
    isPaused,
    isPlaying,
    nextPiece,
    highScore,
    level,
    linesToClear,
    isClearing,
    clearAnimationFrame,
    currentPiece,
    startGame,
    pauseGame,
    resetGame,
    movePiece,
    rotatePiece,
    quickDrop,
    hardDropPiece,
    cleanupGame
} = gameStateService;

// 触摸控制相关变量
let touchStartX = 0;
let touchStartY = 0;
let lastTouchTime = 0;
let lastMoveTime = 0; // 添加最后移动时间变量，用于节流

// 键盘事件处理
const handleKeydown = (e: KeyboardEvent) => {
    if (isGameOver.value) return;

    switch (e.key) {
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
            quickDrop();
            break;
        case ' ':
            hardDropPiece();
            break;
        case 'p':
        case 'P':
            pauseGame();
            break;
    }
};

// 触摸事件处理
const handleTouchStart = (e: TouchEvent) => {
    if (isGameOver.value || !isPlaying.value) return;

    // 阻止默认行为，防止滚动和缩放
    e.preventDefault();

    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    lastTouchTime = Date.now();
};

const handleTouchMove = (e: TouchEvent) => {
    if (isGameOver.value || !isPlaying.value || isPaused.value) return;

    // 阻止默认行为，防止滚动
    e.preventDefault();

    const currentTime = Date.now();
    // 添加节流逻辑，避免过快触发移动（至少间隔100ms）
    if (currentTime - lastMoveTime < 100) return;

    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartX;
    const diffY = touch.clientY - touchStartY;

    // 调整触摸灵敏度阈值，使其在不同设备上更一致
    const touchThreshold = windowWidth.value < 768 ? 20 : 30;

    // 水平移动
    if (Math.abs(diffX) > touchThreshold && Math.abs(diffX) > Math.abs(diffY)) {
        movePiece(diffX > 0 ? 1 : -1);
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        lastMoveTime = currentTime; // 更新最后移动时间
    }

    // 垂直移动（下滑）
    if (diffY > touchThreshold && Math.abs(diffY) > Math.abs(diffX)) {
        quickDrop();
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        lastMoveTime = currentTime; // 更新最后移动时间
    }
};

const handleTouchEnd = (e: TouchEvent) => {
    if (isGameOver.value || !isPlaying.value) return;

    // 阻止默认行为
    e.preventDefault();

    const currentTime = Date.now();
    const timeDiff = currentTime - lastTouchTime;

    // 调整点击检测阈值，使其在不同设备上更一致
    const tapThreshold = windowWidth.value < 768 ? 15 : 20;

    // 检测是否为快速点击（轻触）- 用于旋转
    if (timeDiff < 300 &&
        Math.abs(e.changedTouches[0].clientX - touchStartX) < tapThreshold &&
        Math.abs(e.changedTouches[0].clientY - touchStartY) < tapThreshold) {
        rotatePiece();
    }
};

// 页面可见性变化处理
const handleVisibilityChange = () => {
    if (document.hidden && isPlaying.value && !isPaused.value) {
        pauseGame();
    }
};

// 存储事件监听器引用
const eventListeners = {
    gameBoardTouchStart: null as EventListener | null,
    gameBoardTouchMove: null as EventListener | null,
    gameBoardTouchEnd: null as EventListener | null,
    mobileGameBoardTouchStart: null as EventListener | null,
    mobileGameBoardTouchMove: null as EventListener | null,
    mobileGameBoardTouchEnd: null as EventListener | null
};

// 组件挂载时
onMounted(() => {
    // 初始化游戏
    resetGame();

    // 添加事件监听
    if (typeof window !== 'undefined') {
        window.addEventListener('resize', handleResize);
        window.addEventListener('keydown', handleKeydown);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // 更新方块大小
        blockSize.value = windowWidth.value < 768 ? 20 : GAME_CONFIG.BASE_BLOCK_SIZE;

        // 保存事件监听器引用
        eventListeners.gameBoardTouchStart = handleTouchStart as EventListener;
        eventListeners.gameBoardTouchMove = handleTouchMove as EventListener;
        eventListeners.gameBoardTouchEnd = handleTouchEnd as EventListener;
        eventListeners.mobileGameBoardTouchStart = handleTouchStart as EventListener;
        eventListeners.mobileGameBoardTouchMove = handleTouchMove as EventListener;
        eventListeners.mobileGameBoardTouchEnd = handleTouchEnd as EventListener;

        // 添加触摸事件监听 - PC端游戏板
        const gameBoardEl = document.querySelector('.game-board');
        if (gameBoardEl) {
            gameBoardEl.addEventListener('touchstart', eventListeners.gameBoardTouchStart);
            gameBoardEl.addEventListener('touchmove', eventListeners.gameBoardTouchMove);
            gameBoardEl.addEventListener('touchend', eventListeners.gameBoardTouchEnd);
        }

        // 添加触摸事件监听 - 移动端游戏板
        const mobileGameBoard = document.querySelector('.mobile-game-board');
        if (mobileGameBoard) {
            mobileGameBoard.addEventListener('touchstart', eventListeners.mobileGameBoardTouchStart);
            mobileGameBoard.addEventListener('touchmove', eventListeners.mobileGameBoardTouchMove);
            mobileGameBoard.addEventListener('touchend', eventListeners.mobileGameBoardTouchEnd);
        }
    }
});

// 组件卸载时
onUnmounted(() => {
    // 清理游戏资源
    cleanupGame();

    // 移除事件监听
    if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKeydown);
        document.removeEventListener('visibilitychange', handleVisibilityChange);

        // 移除触摸事件监听 - PC端游戏板
        const gameBoardEl = document.querySelector('.game-board');
        if (gameBoardEl && eventListeners.gameBoardTouchStart) {
            gameBoardEl.removeEventListener('touchstart', eventListeners.gameBoardTouchStart);
            gameBoardEl.removeEventListener('touchmove', eventListeners.gameBoardTouchMove!);
            gameBoardEl.removeEventListener('touchend', eventListeners.gameBoardTouchEnd!);
        }

        // 移除触摸事件监听 - 移动端游戏板
        const mobileGameBoard = document.querySelector('.mobile-game-board');
        if (mobileGameBoard && eventListeners.mobileGameBoardTouchStart) {
            mobileGameBoard.removeEventListener('touchstart', eventListeners.mobileGameBoardTouchStart);
            mobileGameBoard.removeEventListener('touchmove', eventListeners.mobileGameBoardTouchMove!);
            mobileGameBoard.removeEventListener('touchend', eventListeners.mobileGameBoardTouchEnd!);
        }
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
            <!-- 上方信息区域 - 新布局：左边分数，中间控制按钮，右边下一个方块 -->
            <div class="mobile-top-area">
                <!-- 左侧分数区域 -->
                <ScoreDisplay :score="score" :high-score="highScore" :level="level" class="mobile-score" />

                <!-- 中间控制按钮区域 -->
                <div class="mobile-controls-area">
                    <ControlButtons :is-playing="isPlaying" :is-game-over="isGameOver" :is-paused="isPaused"
                        @start="startGame" @pause="pauseGame" @reset="resetGame" />
                </div>

                <!-- 右侧下一个方块预览 -->
                <NextPiecePreview :next-piece="nextPiece" :block-size="blockSize" class="mobile-preview" />
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
                    <button @click="hardDropPiece" class="drop-btn">下降</button>
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
    padding: 10px;
    min-height: 95vh;
    /* 减小高度，避免滚动条 */
    background-color: #1a1a1a;
    color: white;
    font-family: 'Arial', sans-serif;
    box-sizing: border-box;
}

.game-header {
    margin-bottom: 10px;
    text-align: center;
}

.game-header h1 {
    font-size: 1.8em;
    color: #4CAF50;
    margin: 0;
}

.game-content {
    display: flex;
    justify-content: center;
    gap: 15px;
    max-width: 95vw;
    /* 限制最大宽度 */
}

.desktop-layout {
    display: flex;
}

.mobile-layout {
    display: none;
    flex-direction: column;
    align-items: center;
    width: 100%;
}

.left-panel,
.right-panel {
    display: flex;
    flex-direction: column;
    gap: 15px;
    max-width: 180px;
    /* 减小宽度 */
}

.center-panel {
    display: flex;
    justify-content: center;
}

.instructions {
    background-color: rgba(0, 0, 0, 0.3);
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #333;
    font-size: 0.9em;
    /* 减小字体大小 */
}

.instructions h3 {
    margin-top: 0;
    margin-bottom: 8px;
    color: #4CAF50;
    font-size: 1em;
}

.instructions p {
    margin: 4px 0;
}

/* 移动端布局样式 */
.mobile-top-area {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    width: 100%;
    margin-bottom: 10px;
    gap: 5px;
}

.mobile-score {
    flex: 1;
    max-width: 30%;
    transform-origin: left center;
}

.mobile-controls-area {
    flex: 1;
    display: flex;
    justify-content: center;
    max-width: 40%;
    transform-origin: center;
}

.mobile-preview {
    flex: 1;
    max-width: 30%;
    transform-origin: right center;
}

.mobile-controls {
    width: 100%;
    max-width: 300px;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 8px;
    border-radius: 8px;
    border: 1px solid #333;
    margin-top: 5px;
}

.control-row {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 5px;
}

.control-row:last-child {
    margin-bottom: 0;
}

.mobile-controls button {
    width: 45px;
    height: 45px;
    font-size: 1.1em;
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
        padding: 5px;
        min-height: 98vh;
    }

    .game-header h1 {
        font-size: 1.4em;
        margin-bottom: 5px;
    }

    .desktop-layout {
        display: none;
    }

    .mobile-layout {
        display: flex;
    }

    /* 移动端组件样式调整 */
    .mobile-score,
    .mobile-preview,
    .mobile-controls-area {
        transform: scale(0.9);
        margin: 0;
        height: 120px;
        /* 统一高度 */
        display: flex;
        align-items: center;
    }

    .mobile-game-board {
        margin: 5px 0;
    }

    /* 控制按钮样式调整 */
    .mobile-controls-area :deep(.controls) {
        flex-direction: column;
        gap: 5px;
        height: 100%;
        justify-content: center;
        padding: 8px;
    }

    .mobile-controls-area :deep(button) {
        padding: 8px;
        font-size: 0.9em;
        width: 100%;
    }
}

/* 小屏幕手机适配 */
@media (max-width: 375px) {

    .mobile-score,
    .mobile-preview,
    .mobile-controls-area {
        transform: scale(0.85);
        height: 110px;
        /* 稍微减小高度 */
    }

    .mobile-controls button {
        width: 40px;
        height: 40px;
    }
}
</style>