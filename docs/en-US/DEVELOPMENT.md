# Development Guide

This document provides development guidelines for the Vue3 Tetris Game project, including project structure, key components, and development considerations.

## Project Structure

```
src/
  ├── components/     # Components directory
  │   ├── TetrisBoard.vue     # Main game component
  │   ├── GameBoard.vue       # Game board component
  │   ├── NextPiecePreview.vue # Next piece preview component
  │   ├── ScoreDisplay.vue    # Score display component
  │   └── ControlButtons.vue  # Control buttons component
  ├── types/          # Type definitions
  │   └── tetris.ts   # Game type definitions
  ├── utils/          # Utility functions
  │   └── tetrisUtils.ts # Game utility functions
  ├── services/       # Service layer
  │   ├── tetrisGameService.ts # Game logic service
  │   └── gameStateService.ts  # Game state management service
  ├── constants/      # Constants
  │   └── gameConstants.ts # Game constants
  ├── assets/         # Static assets
  ├── App.vue         # Root component
  ├── main.ts         # Entry file
  └── style.css       # Global styles
```

## Key Components

### TetrisBoard.vue

The main game component responsible for integrating all sub-components and handling the main game logic.

- Imports and uses the game state service
- Handles keyboard and touch events
- Manages window size changes
- Handles page visibility changes

### GameBoard.vue

Game board component responsible for rendering the game board and current piece.

- Receives game board data and current piece
- Renders the game board and current piece
- Handles line clearing animations
- Displays game over and pause overlays

### NextPiecePreview.vue

Next piece preview component that displays the upcoming piece.

- Receives next piece data
- Calculates and renders the preview area

### ScoreDisplay.vue

Score display component that shows current score, high score, and level.

- Receives score, high score, and level data
- Renders score information

### ControlButtons.vue

Control buttons component that provides game control buttons.

- Provides start, pause, and reset buttons
- Displays different buttons based on game state

## Service Layer

### gameStateService.ts

Game state management service responsible for managing game state and logic.

- Creates shared state using Vue's reactive API
- Provides game operation methods (start, pause, reset, etc.)
- Manages game loop and state updates

### tetrisGameService.ts

Game logic service that provides core game logic functionality.

- Provides piece merging, line clearing, score calculation features
- Implements wall kick algorithm and piece rotation logic
- Handles collision detection and game rules

## Type Definitions

### tetris.ts

Defines types used in the game.

- `TetrisPiece`: Piece type
- `GameBoard`: Game board type
- `PieceType`: Piece shape type

## Constants

### gameConstants.ts

Defines constants used in the game.

- Game board dimensions
- Piece shapes and colors
- Game speed and scoring rules
- Animation parameters

## Development Considerations

1. **Responsive Design**: Ensure the game runs well on different devices, use media queries to adapt to different screen sizes.

2. **Performance Optimization**:
   - Use `requestAnimationFrame` for animations and game loop
   - Avoid unnecessary re-renders
   - Optimize touch event handling

3. **Code Organization**:
   - Follow the single responsibility principle
   - Use service layer to separate game logic and state management
   - Use TypeScript type system to ensure type safety

4. **Event Handling**:
   - Properly handle keyboard and touch events
   - Clean up event listeners when components are unmounted
   - Handle page visibility changes

5. **Game State Management**:
   - Use Vue's reactive API to manage game state
   - Ensure consistency of state updates
   - Properly handle game pause and resume

## Debugging Tips

1. Use Vue DevTools to inspect component state and properties.
2. Use browser console to print key variables and states.
3. Use breakpoints to debug complex logic.
4. Use performance profiling tools to check performance bottlenecks.

## Contribution Guidelines

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code adheres to the project's code style and quality standards. 