/**
 * 俄罗斯方块游戏工具函数
 */
import { TETROMINOES, GAME_CONFIG } from '../constants/gameConstants';
import type { TetrisPiece, GameBoard } from '../types/tetris';

/**
 * 生成随机方块
 */
export const generateRandomPiece = (): TetrisPiece => {
    const randomPiece = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
    return {
        shape: JSON.parse(JSON.stringify(randomPiece.shape)), // 深拷贝形状
        x: Math.floor(GAME_CONFIG.BOARD_WIDTH / 2) - Math.floor(randomPiece.shape[0].length / 2),
        y: 0,
        color: randomPiece.color
    };
};

/**
 * 检查碰撞
 */
export const checkCollision = (
    piece: TetrisPiece | null,
    gameBoard: GameBoard,
    offsetX = 0,
    offsetY = 0
): boolean => {
    if (!piece || !piece.shape) return true;

    return piece.shape.some((row, y) =>
        row.some((value, x) => {
            if (!value) return false;
            const newX = piece.x + x + offsetX;
            const newY = piece.y + y + offsetY;
            return (
                newX < 0 ||
                newX >= GAME_CONFIG.BOARD_WIDTH ||
                newY >= GAME_CONFIG.BOARD_HEIGHT ||
                (newY >= 0 && gameBoard[newY][newX])
            );
        })
    );
};

/**
 * 旋转方块
 */
export const rotateShape = (shape: number[][]): number[][] => {
    return shape[0].map((_, i) => shape.map(row => row[i]).reverse());
};

/**
 * 计算游戏速度
 */
export const calculateGameSpeed = (score: number): number => {
    const baseSpeed = 1000; // 基础速度1秒
    const minSpeed = 100;   // 最小速度100毫秒
    const speedFactor = Math.floor(score / 500); // 每500分加快一次
    return Math.max(minSpeed, baseSpeed - speedFactor * 100);
};

/**
 * 创建空游戏板
 */
export const createEmptyBoard = (): GameBoard => {
    return Array(GAME_CONFIG.BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(GAME_CONFIG.BOARD_WIDTH).fill(0));
}; 