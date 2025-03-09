/**
 * 俄罗斯方块游戏常量定义
 */

/**
 * 俄罗斯方块形状定义
 */
export const TETROMINOES = [
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

/**
 * 游戏配置常量
 */
export const GAME_CONFIG = {
    BOARD_WIDTH: 10,
    BOARD_HEIGHT: 20,
    BASE_BLOCK_SIZE: 30,
    CLEAR_ANIMATION_FRAMES: 6,
    ANIMATION_FRAME_DURATION: 80
}; 