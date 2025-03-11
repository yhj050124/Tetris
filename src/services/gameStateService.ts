/**
 * 游戏状态管理服务
 * 负责管理游戏状态、游戏循环和游戏逻辑
 */
import { ref, computed } from 'vue';
import type { TetrisPiece, GameBoard } from '../types/tetris';
import { GAME_CONFIG } from '../constants/gameConstants';
import { generateRandomPiece, checkCollision, createEmptyBoard, calculateGameSpeed } from '../utils/tetrisUtils';
import { mergePiece, findLinesToClear, removeLines, calculateScore, rotateWithWallKick, hardDrop } from './tetrisGameService';

// 创建响应式状态
const gameBoard = ref<GameBoard>(createEmptyBoard());
const score = ref(0);
const isGameOver = ref(false);
const isPaused = ref(false);
const isPlaying = ref(false);
const nextPiece = ref<TetrisPiece | null>(null);
const highScore = ref(localStorage.getItem('tetrisHighScore') ? parseInt(localStorage.getItem('tetrisHighScore') || '0') : 0);
const level = computed(() => Math.floor(score.value / 500) + 1);
const linesToClear = ref<number[]>([]);
const isClearing = ref(false);
const clearAnimationFrame = ref(0);
const currentPiece = ref<TetrisPiece | null>(null);

// 游戏循环ID
let gameLoopInterval: number | null = null;
// 上次下落时间
let lastDropTime = 0;

/**
 * 生成新方块
 */
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

    // 检查游戏是否结束
    if (checkCollision(currentPiece.value, gameBoard.value)) {
        isGameOver.value = true;
        isPlaying.value = false;
        if (gameLoopInterval) {
            cancelAnimationFrame(gameLoopInterval);
            gameLoopInterval = null;
        }
    }
};

/**
 * 处理方块下落
 */
const dropPiece = (): boolean => {
    if (!currentPiece.value) return false;

    if (!checkCollision(currentPiece.value, gameBoard.value, 0, 1)) {
        currentPiece.value.y++;
        return true;
    } else {
        // 方块已到底部，合并到游戏板
        gameBoard.value = mergePiece(gameBoard.value, currentPiece.value);

        // 检查是否有行需要消除
        const lines = findLinesToClear(gameBoard.value);
        if (lines.length > 0) {
            // 设置消除动画状态
            linesToClear.value = lines;
            isClearing.value = true;
            clearAnimationFrame.value = 0;

            // 计算分数
            const linesScore = calculateScore(lines.length);
            score.value += linesScore;

            // 更新最高分
            if (score.value > highScore.value) {
                highScore.value = score.value;
                localStorage.setItem('tetrisHighScore', highScore.value.toString());
            }

            return true;
        }

        // 生成新方块
        generateNewPiece();

        // 检查游戏结束
        if (checkCollision(currentPiece.value, gameBoard.value)) {
            isGameOver.value = true;
            isPlaying.value = false;
            return false;
        }

        return true;
    }
};

/**
 * 执行行消除动画
 */
const performClearAnimation = (): boolean => {
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

/**
 * 移动方块
 */
const movePiece = (dx: number): void => {
    if (!currentPiece.value || isPaused.value || isGameOver.value || !isPlaying.value) return;

    if (!checkCollision(currentPiece.value, gameBoard.value, dx, 0)) {
        currentPiece.value.x += dx;
    }
};

/**
 * 旋转方块
 */
const rotatePiece = (): void => {
    if (!currentPiece.value || isPaused.value || isGameOver.value || !isPlaying.value) return;

    const rotatedPiece = rotateWithWallKick(currentPiece.value, gameBoard.value);
    if (rotatedPiece !== currentPiece.value) {
        currentPiece.value = rotatedPiece;
    }
};

/**
 * 快速下落
 */
const quickDrop = (): void => {
    if (!currentPiece.value || isPaused.value || isGameOver.value || !isPlaying.value) return;

    currentPiece.value.y++;
};

/**
 * 硬下落（直接到底）
 */
const hardDropPiece = (): void => {
    if (!currentPiece.value || isPaused.value || isGameOver.value || !isPlaying.value) return;

    const droppedPiece = hardDrop(currentPiece.value, gameBoard.value);
    if (droppedPiece) {
        currentPiece.value = droppedPiece;
        dropPiece(); // 触发方块合并和新方块生成
    }
};

/**
 * 游戏循环
 */
const gameLoop = (timestamp: number): void => {
    if (!isPlaying.value || isPaused.value) {
        if (gameLoopInterval) {
            gameLoopInterval = requestAnimationFrame(gameLoop);
        }
        return;
    }

    // 处理消除动画
    if (performClearAnimation()) {
        gameLoopInterval = requestAnimationFrame(gameLoop);
        return;
    }

    // 计算下落速度
    const dropSpeed = calculateGameSpeed(level.value);

    // 处理方块下落
    if (timestamp - lastDropTime > dropSpeed) {
        lastDropTime = timestamp;
        dropPiece();
    }

    gameLoopInterval = requestAnimationFrame(gameLoop);
};

/**
 * 开始游戏
 */
const startGame = (): void => {
    if (isPlaying.value && !isPaused.value) return;

    if (isGameOver.value) {
        resetGame();
    }

    isPaused.value = false;
    isPlaying.value = true;

    if (!gameLoopInterval) {
        lastDropTime = performance.now();
        gameLoopInterval = requestAnimationFrame(gameLoop);
    }
};

/**
 * 暂停游戏
 */
const pauseGame = (): void => {
    if (!isPlaying.value) return;

    isPaused.value = !isPaused.value;
};

/**
 * 重置游戏
 */
const resetGame = (): void => {
    // 重置游戏状态
    gameBoard.value = createEmptyBoard();
    score.value = 0;
    isGameOver.value = false;
    isPaused.value = false;
    isPlaying.value = false;
    linesToClear.value = [];
    isClearing.value = false;
    clearAnimationFrame.value = 0;

    // 生成新方块
    nextPiece.value = generateRandomPiece();
    generateNewPiece();

    // 停止当前游戏循环
    if (gameLoopInterval) {
        cancelAnimationFrame(gameLoopInterval);
        gameLoopInterval = null;
    }
};

/**
 * 清理游戏资源
 */
const cleanupGame = (): void => {
    if (gameLoopInterval) {
        cancelAnimationFrame(gameLoopInterval);
        gameLoopInterval = null;
    }
};

// 导出游戏状态和方法
export const gameStateService = {
    // 状态
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

    // 方法
    startGame,
    pauseGame,
    resetGame,
    movePiece,
    rotatePiece,
    quickDrop,
    hardDropPiece,
    cleanupGame
}; 