/**
 * 俄罗斯方块游戏逻辑服务
 */
import type { TetrisPiece, GameBoard } from '../types/tetris';
import { GAME_CONFIG } from '../constants/gameConstants';
import { checkCollision } from '../utils/tetrisUtils';

/**
 * 合并方块到游戏板
 */
export const mergePiece = (gameBoard: GameBoard, piece: TetrisPiece | null): GameBoard => {
    if (!piece || !piece.shape) return gameBoard;

    const newBoard = gameBoard.map(row => [...row]);
    const { shape, x, y, color } = piece;

    shape.forEach((row, pieceY) => {
        row.forEach((value, pieceX) => {
            if (value) {
                const boardY = y + pieceY;
                const boardX = x + pieceX;
                if (boardY >= 0 && boardY < GAME_CONFIG.BOARD_HEIGHT && boardX >= 0 && boardX < GAME_CONFIG.BOARD_WIDTH) {
                    newBoard[boardY][boardX] = { value: 1, color };
                }
            }
        });
    });

    return newBoard;
};

/**
 * 查找需要清除的行
 */
export const findLinesToClear = (gameBoard: GameBoard): number[] => {
    const lines: number[] = [];
    for (let y = GAME_CONFIG.BOARD_HEIGHT - 1; y >= 0; y--) {
        if (gameBoard[y].every(cell => cell !== 0 && cell.value !== 0)) {
            lines.push(y);
        }
    }
    return lines;
};

/**
 * 移除行并在顶部添加新行
 */
export const removeLines = (gameBoard: GameBoard, lines: number[]): GameBoard => {
    // 创建一个新的游戏板副本
    const newBoard = gameBoard.map(row => [...row]);

    // 按照从下到上的顺序排序行索引（确保先删除下面的行）
    const sortedLines = [...lines].sort((a, b) => b - a);

    // 移除行
    for (const y of sortedLines) {
        // 确保行索引在有效范围内
        if (y >= 0 && y < GAME_CONFIG.BOARD_HEIGHT) {
            newBoard.splice(y, 1);
            // 在顶部添加新行
            newBoard.unshift(Array(GAME_CONFIG.BOARD_WIDTH).fill(0));
        }
    }

    return newBoard;
};

/**
 * 计算分数
 */
export const calculateScore = (linesCleared: number): number => {
    const points = [0, 100, 300, 500, 800]; // 0, 1, 2, 3, 4行的分数
    return linesCleared <= 4 ? points[linesCleared] : linesCleared * 200;
};

/**
 * 旋转方块并处理墙踢
 */
export const rotateWithWallKick = (
    piece: TetrisPiece,
    gameBoard: GameBoard
): TetrisPiece => {
    if (!piece || !piece.shape) return piece;

    // 创建新的方块对象
    const newPiece = { ...piece };

    // 旋转形状
    const newShape = piece.shape[0].map((_, i) =>
        piece.shape.map(row => row[i]).reverse()
    );

    newPiece.shape = newShape;

    // 检查碰撞
    if (!checkCollision(newPiece, gameBoard)) {
        return newPiece;
    }

    // 尝试墙踢 - 左移
    for (let offset = 1; offset <= 2; offset++) {
        const kickedPiece = { ...newPiece, x: newPiece.x - offset };
        if (!checkCollision(kickedPiece, gameBoard)) {
            return kickedPiece;
        }
    }

    // 尝试墙踢 - 右移
    for (let offset = 1; offset <= 2; offset++) {
        const kickedPiece = { ...newPiece, x: newPiece.x + offset };
        if (!checkCollision(kickedPiece, gameBoard)) {
            return kickedPiece;
        }
    }

    // 尝试墙踢 - 上移（处理底部碰撞）
    for (let offset = 1; offset <= 2; offset++) {
        const kickedPiece = { ...newPiece, y: newPiece.y - offset };
        if (!checkCollision(kickedPiece, gameBoard)) {
            return kickedPiece;
        }
    }

    // 如果都不行，返回原始方块
    return piece;
};

/**
 * 快速下落
 */
export const hardDrop = (
    piece: TetrisPiece | null,
    gameBoard: GameBoard
): TetrisPiece | null => {
    if (!piece) return null;

    const newPiece = { ...piece };

    while (!checkCollision(newPiece, gameBoard, 0, 1)) {
        newPiece.y++;
    }

    return newPiece;
}; 