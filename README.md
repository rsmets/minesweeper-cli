# Minesweeper CLI

A command-line Minesweeper game built with Node.js and TypeScript.

## Features

- **Arbitrary grid dimensions**: Configure width and height as desired
- **Customizable bomb percentage**: Set the percentage of cells that contain bombs
- **Intuitive coordinate system**: Use coordinates like "A1", "B5", etc.
- **Visual board display**: Clean ASCII representation with emojis
- **Flag functionality**: Mark suspected bomb locations

## Installation

1. Install dependencies:
```bash
pnpm install
```

2. Build the project:
```bash
pnpm run build
```

### Why pnpm?

This project uses **pnpm** instead of npm as the package manager for several advantages:

- **Faster installations**: pnpm uses a content-addressable store, making installations significantly faster
- **Disk space efficiency**: Shared dependencies across projects save disk space through hard linking
- **Strict dependency resolution**: Prevents phantom dependencies and ensures reproducible builds
- **Better monorepo support**: Superior handling of workspaces and linked packages
- **Drop-in replacement**: Uses the same `package.json` format and most npm commands work identically

To install pnpm: `npm install -g pnpm`

## Usage

### Development Mode
```bash
pnpm run dev
```

### Production Mode
```bash
pnpm run build
pnpm start
```

## Game Configuration

When you start the game, you'll be prompted to configure:

1. **Grid Width**: Number of columns (3-50)
2. **Grid Height**: Number of rows (3-50) 
3. **Bomb Percentage**: Percentage of cells containing bombs (5-40%)

## Game Commands

- **Reveal cell**: Enter coordinates like `A1`, `B5`, `C10`
- **Flag/Unflag cell**: Enter `F A1`, `F B5`, etc.
- **Quit game**: Enter `Q` or `QUIT`

## Coordinate System

- **Columns**: Letters starting from A (A, B, C, ...)
- **Rows**: Numbers starting from 1 (1, 2, 3, ...)
- **Examples**: A1, B2, C3, Z26

## Board Symbols

- **F** **Flag**: Marked as potential bomb
- **.** **Hidden**: Unrevealed cell
- **(space)** **Empty**: Revealed cell with no adjacent bombs
- **1-8**: Number of adjacent bombs
- **\*** **Bomb**: Revealed bomb (game over)

## Game Rules

1. Click on cells to reveal them
2. Numbers indicate how many bombs are adjacent (including diagonals)
3. If you reveal a bomb, you lose
4. If you reveal all non-bomb cells, you win
5. Use flags to mark suspected bomb locations

## Example Game Flow

```
⚙️  Game Configuration
====================
Enter grid width (e.g., 10): 8
Enter grid height (e.g., 10): 8
Enter bomb percentage (e.g., 15.5): 12.5

🎯 Game started! Use coordinates like "A1" to reveal cells, or "F A1" to flag/unflag.
📋 Commands: [coordinate] to reveal, F [coordinate] to flag, Q to quit


====================================
    A  B  C  D  E  F  G  H 
 1  .  .  .  .  .  .  .  . 
 2  .  .  .  .  .  .  .  . 
 3  .  .  .  .  .  .  .  . 
 4  .  .  .  .  .  .  .  . 
 5  .  .  .  .  .  .  .  . 
 6  .  .  .  .  .  .  .  . 
 7  .  .  .  .  .  .  .  . 
 8  .  .  .  .  .  .  .  . 
====================================

Enter command: 
```

## Development

### Project Structure
```
src/
├── index.ts      # Main entry point
├── cli.ts        # CLI interface and user interaction
├── game.ts       # Core game logic
└── types.ts      # TypeScript type definitions
```

### Scripts
- `pnpm run build`: Compile TypeScript to JavaScript
- `pnpm run start`: Run the compiled game
- `pnpm run dev`: Run in development mode tsx
- `pnpm run dev:watch`: Run in development mode tsx with watch
- `pnpm run clean`: Remove compiled files

## Requirements Implemented

✅ Grid of arbitrary dimensions  
✅ Configurable bomb percentage  
✅ Two bomb population modes (before/after first click)  
✅ Terminal-based interface with text coordinates (A1, B2, etc.)  
✅ Bomb detection and game over logic  
✅ Adjacent bomb counting  
✅ Recursive reveal for empty cells (flood fill)  
✅ Flag functionality for marking suspected bombs  

Enjoy playing Minesweeper! 🎮
