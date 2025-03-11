# 开发指南

本文档提供了关于Vue3俄罗斯方块游戏项目的开发指南，包括项目结构、关键组件和开发注意事项。

## 项目结构

```
src/
  ├── components/     # 组件目录
  │   ├── TetrisBoard.vue     # 主游戏组件
  │   ├── GameBoard.vue       # 游戏板组件
  │   ├── NextPiecePreview.vue # 下一个方块预览组件
  │   ├── ScoreDisplay.vue    # 分数显示组件
  │   └── ControlButtons.vue  # 控制按钮组件
  ├── types/          # 类型定义
  │   └── tetris.ts   # 游戏类型定义
  ├── utils/          # 工具函数
  │   └── tetrisUtils.ts # 游戏工具函数
  ├── services/       # 服务层
  │   ├── tetrisGameService.ts # 游戏逻辑服务
  │   └── gameStateService.ts  # 游戏状态管理服务
  ├── constants/      # 常量定义
  │   └── gameConstants.ts # 游戏常量
  ├── assets/         # 静态资源
  ├── App.vue         # 根组件
  ├── main.ts         # 入口文件
  └── style.css       # 全局样式
```

## 关键组件

### TetrisBoard.vue

主游戏组件，负责整合所有子组件并处理游戏的主要逻辑。

- 导入并使用游戏状态服务
- 处理键盘和触摸事件
- 管理窗口大小变化
- 处理页面可见性变化

### GameBoard.vue

游戏板组件，负责渲染游戏板和当前方块。

- 接收游戏板数据和当前方块
- 渲染游戏板和当前方块
- 处理行消除动画
- 显示游戏结束和暂停覆盖层

### NextPiecePreview.vue

下一个方块预览组件，显示即将出现的方块。

- 接收下一个方块数据
- 计算并渲染预览区域

### ScoreDisplay.vue

分数显示组件，显示当前分数、最高分和级别。

- 接收分数、最高分和级别数据
- 渲染分数信息

### ControlButtons.vue

控制按钮组件，提供游戏控制按钮。

- 提供开始、暂停和重置按钮
- 根据游戏状态显示不同按钮

## 服务层

### gameStateService.ts

游戏状态管理服务，负责管理游戏状态和逻辑。

- 使用Vue的响应式API创建共享状态
- 提供游戏操作方法（开始、暂停、重置等）
- 管理游戏循环和状态更新

### tetrisGameService.ts

游戏逻辑服务，提供核心游戏逻辑功能。

- 提供方块合并、行消除、分数计算等功能
- 实现墙踢算法和方块旋转逻辑
- 处理碰撞检测和游戏规则

## 类型定义

### tetris.ts

定义游戏中使用的类型。

- `TetrisPiece`: 方块类型
- `GameBoard`: 游戏板类型
- `PieceType`: 方块形状类型

## 常量定义

### gameConstants.ts

定义游戏中使用的常量。

- 游戏板尺寸
- 方块形状和颜色
- 游戏速度和分数规则
- 动画参数

## 开发注意事项

1. **响应式设计**：确保游戏在不同设备上都能良好运行，使用媒体查询适配不同屏幕尺寸。

2. **性能优化**：
   - 使用`requestAnimationFrame`进行动画和游戏循环
   - 避免不必要的重渲染
   - 优化触摸事件处理

3. **代码组织**：
   - 遵循单一职责原则
   - 使用服务层分离游戏逻辑和状态管理
   - 使用TypeScript类型系统确保类型安全

4. **事件处理**：
   - 正确处理键盘和触摸事件
   - 在组件卸载时清理事件监听器
   - 处理页面可见性变化

5. **游戏状态管理**：
   - 使用Vue的响应式API管理游戏状态
   - 确保状态更新的一致性
   - 正确处理游戏暂停和恢复

## 调试技巧

1. 使用Vue DevTools检查组件状态和属性。
2. 使用浏览器控制台打印关键变量和状态。
3. 使用断点调试复杂逻辑。
4. 使用性能分析工具检查性能瓶颈。

## 贡献指南

1. Fork 项目
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

请确保你的代码符合项目的代码风格和质量标准。 