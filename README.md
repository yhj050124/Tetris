# Vue3 Tetris Game

这是一个使用Vue3和TypeScript开发的现代化俄罗斯方块游戏。游戏保持了经典俄罗斯方块的核心玩法，同时采用了现代化的技术栈和优雅的界面设计。

## 功能特点

- 经典的俄罗斯方块游戏玩法
- 支持方块旋转和移动
- 实时分数统计
- 游戏暂停/继续功能
- 游戏结束提示
- 响应式设计
- 现代化UI界面

## 技术栈

- Vue3 - 渐进式JavaScript框架
- TypeScript - 添加静态类型的JavaScript超集
- Vite - 下一代前端构建工具

## 本地开发

确保你的开发环境中已安装Node.js (推荐v14.0.0或更高版本)

```bash
# 克隆项目
git clone https://github.com/yhj050124/Tetris.git

# 进入项目目录
cd Tetris

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 游戏控制

- ⬅️ 方向键左：向左移动方块
- ➡️ 方向键右：向右移动方块
- ⬆️ 方向键上：旋转方块
- ⬇️ 方向键下：加速下落
- 空格键：暂停/继续游戏

## 项目结构

```
src/
  ├── components/     # 组件目录
  │   └── TetrisBoard.vue  # 主游戏组件
  ├── assets/         # 静态资源
  ├── App.vue         # 根组件
  ├── main.ts         # 入口文件
  └── style.css       # 全局样式
```

## 贡献

欢迎提交问题和改进建议！

## 许可证

[MIT License](LICENSE)
