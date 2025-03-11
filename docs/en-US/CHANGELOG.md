# Changelog

This document records the version history of the Vue3 Tetris Game.

## v1.0.3 (2023-03-11)

### Bug Fixes
- Fixed potential wall kick logic issues, added upward wall kick
- Fixed performance issues in game loop, optimized performance in paused state
- Fixed potential issues in touch event handling, added throttling logic
- Fixed type checking issues in line clearing logic
- Fixed potential issues in hard drop function, added return value check
- Fixed incomplete event listener cleanup
- Fixed incomplete board boundary check, added top boundary check

### Performance Optimization
- Optimized touch event handling for mobile devices, improved precision
- Optimized game speed calculation for more reasonable speed progression

### Documentation Improvements
- Reorganized project documentation structure, created separate changelog file
- Added Chinese and English documentation directories for internationalization
- Updated project structure description, added documentation directory information

## v1.0.2 (2023-03-10)

### Code Architecture Optimization
- Created game state management service, separated game state and logic from components
- Reduced coupling between components, improved code maintainability
- Optimized event handling and game loop logic

### Bug Fixes
- Fixed issues with multiple line clearing not being completely cleared
- Improved line clearing algorithm to ensure correct handling of multiple line clearing

### Performance Optimization
- Optimized game state update logic, reduced unnecessary re-renders
- Improved touch control responsiveness

## v1.0.1 (2023-03-09)

### Feature Improvements
- Refactored game loop using requestAnimationFrame for smoother animations
- Added line clearing flash animation for better visual experience
- Optimized animation parameters, reduced flash count for more comfortable experience
- Added page visibility change listener to automatically pause game when switching tabs

### Bug Fixes
- Fixed mobile touch control issues

### Code Refactoring
- Separated type definitions into independent files
- Split components into smaller reusable components
- Separated game logic to service layer
- Extracted utility functions to utility classes

## v1.0.0 (2023-03-08)

### Initial Version
- Implemented basic Tetris game functionality
- Support for piece rotation and movement
- Real-time score tracking and high score recording
- Next piece preview
- Level system that automatically increases speed with score
- Game pause/resume functionality
- Game over notification
- Responsive design supporting both PC and mobile devices
- Mobile touch control support
- Modern UI interface 