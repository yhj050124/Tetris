# Changelog

## v1.0.2 (Current Version)
- **Code Architecture Optimization**:
  - Created game state management service to separate game state and logic from components
  - Reduced coupling between components, improving code maintainability
  - Optimized event handling and game loop logic
- **Bug Fixes**:
  - Fixed an issue where multiple lines might not be completely cleared at once
  - Improved line clearing algorithm to ensure correct handling of multiple line clears
- **Performance Optimization**:
  - Optimized game state update logic to reduce unnecessary re-renders
  - Improved touch control responsiveness
- **Layout Optimization**:
  - Optimized PC layout by reducing height and width to avoid scrollbars
  - Redesigned mobile layout with score, control buttons, and next piece preview in the same row
  - Unified mobile top component heights for better visual appearance
  - Adjusted control buttons to vertical layout for better usability

## v1.0.1
- Refactored game loop using requestAnimationFrame for smoother animations
- Added line clearing flash animation to enhance visual experience
- Optimized animation parameters to reduce flickering
- Added page visibility listener to pause the game when switching tabs
- Fixed touch control issues on mobile devices
- Code refactoring:
  - Extracted type definitions into a separate file
  - Split components into smaller reusable components
  - Separated game logic into a service layer
  - Extracted utility functions into a utility class

## v1.0.0
- Initial release
- Implemented basic Tetris game functionality
- Support for both PC and mobile devices 