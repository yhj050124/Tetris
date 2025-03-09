/**
 * 俄罗斯方块游戏类型定义
 */

/**
 * 俄罗斯方块形状接口
 */
export interface TetrisPiece {
    shape: number[][];
    x: number;
    y: number;
    color: string;
}

/**
 * 游戏板单元格类型
 */
export type Cell = { value: number; color: string } | 0;

/**
 * 游戏板类型
 */
export type GameBoard = Array<Array<Cell>>; 