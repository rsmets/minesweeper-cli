# Minesweeper CLI & Web

A full-featured Minesweeper game with both command-line interface and web-based gameplay, built with Node.js and TypeScript. Features a clean HTML/JavaScript frontend for easy deployment and Model Context Protocol (MCP) integration for AI assistant interactions.

## Features

- **Dual Interface**: Play via command-line interface or web browser
- **Arbitrary grid dimensions**: Configure width and height as desired
- **Customizable bomb percentage**: Set the percentage of cells that contain bombs
- **Intuitive coordinate system**: Use coordinates like "A1", "B5", etc.
- **Visual board display**: Clean ASCII representation (CLI) or interactive web UI
- **Flag functionality**: Mark suspected bomb locations
- **REST API**: Full game API for custom integrations
- **API Authorization**: Protected admin endpoints with admin key authentication
- **Docker support**: Containerized deployment
- **Simple frontend**: Pure HTML/CSS/JavaScript - no build process required
- **MCP Integration**: Model Context Protocol support for AI assistant interactions

## Quick Start

### Web Server (Recommended)

**Using Docker:**
```bash
docker build -t minesweeper-web .
docker run -p 8080:8080 --rm minesweeper-web
```
Then open http://localhost:8080 in your browser.

**Local Development:**
```bash
pnpm install
pnpm build
pnpm start:server
```

### Command Line Interface

**Using Docker:**
```bash
docker run -it --rm minesweeper-web node dist/index.js
```

**Local Development:**
```bash
pnpm install
pnpm dev  # or pnpm build && pnpm start
```

## Installation

1. Install dependencies:
```bash
pnpm install
```

2. Build the project:
```bash
pnpm build
```

### Why pnpm?

This project uses **pnpm** instead of npm as the package manager for several advantages:

- **Faster installations**: pnpm uses a content-addressable store, making installations significantly faster
- **Disk space efficiency**: Shared dependencies across projects save disk space through hard linking
- **Strict dependency resolution**: Prevents phantom dependencies and ensures reproducible builds
- **Better monorepo support**: Superior handling of workspaces and linked packages
- **Drop-in replacement**: Uses the same `package.json` format and most npm commands work identically

To install pnpm: `npm install -g pnpm`

## Usage Modes

### 🌐 Web Server Mode

The web server provides both a web interface and REST API:

**Development:**
```bash
pnpm dev:server:watch    # Auto-reload on changes
pnpm dev:server          # Single run
PORT=8081 pnpm dev:server # Custom port 8081
```

**Production:**
```bash
pnpm build
pnpm start:server
pnpm start:server # With custom port
```

**Web Endpoints:**
- `GET /` - Game interface (play Minesweeper in browser)
- `GET /mcp` - MCP integration documentation and setup

**API Endpoints:**
- `GET /api/health` - Health check
- `POST /api/game` - Create new game
- `GET /api/games` - List all active games (IDs only) - requires admin key
- `GET /api/game/:id` - Get game state
- `POST /api/game/:id/reveal` - Reveal cell
- `POST /api/game/:id/flag` - Toggle flag
- `POST /api/game/:id/command` - CLI-style commands

**MCP Endpoints:**
- `GET /mcp/sse` - Server-Sent Events transport for MCP clients
- `POST /mcp/messages` - Message handling for SSE transport
- `GET /mcp/tools` - Debug endpoint listing available MCP tools

### 🖥️ CLI Mode

Interactive command-line interface:

**Development:**
```bash
pnpm dev                 # TypeScript with tsx
pnpm dev:watch           # Auto-reload on changes
```

**Production:**
```bash
pnpm build
pnpm start               # Runs the CLI game
```

## Game Configuration

When you start the game, you'll be prompted to configure:

1. **Grid Width**: Number of columns (3-50)
2. **Grid Height**: Number of rows (3-50)
3. **Bomb Percentage**: Percentage of cells containing bombs (5-40%)

## Game Commands (CLI)

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

## Docker Usage

### Web Server (Default)
```bash
# Build image
docker build -t minesweeper-web .

# Run web server on port 3000
docker run -p 3000:3000 --rm minesweeper-web

# Run with custom port
docker run -p 8080:3000 --rm minesweeper-web

# Run with environment variables
docker run -p 3000:3000 --rm -e LOG_LEVEL=debug minesweeper-web
```

### CLI Mode
```bash
# Interactive CLI game
docker run -it --rm minesweeper-web node dist/index.js

# With debug logging
docker run -it --rm -e LOG_LEVEL=debug minesweeper-web node dist/index.js
```

### Development with Docker
```bash
# Mount source code for development
docker run -it --rm -v $(pwd):/app -w /app node:24-alpine sh
# Then inside container:
corepack enable && corepack prepare pnpm@latest --activate
pnpm install
pnpm dev:server
```

## API Usage

### Create a Game
```bash
curl -X POST http://localhost:3000/api/game \
  -H "Content-Type: application/json" \
  -d '{"width": 10, "height": 10, "bombPercentage": 15}'
```

### Reveal a Cell
```bash
curl -X POST http://localhost:3000/api/game/{gameId}/reveal \
  -H "Content-Type: application/json" \
  -d '{"row": 0, "col": 0}'
```

### Toggle Flag
```bash
curl -X POST http://localhost:3000/api/game/{gameId}/flag \
  -H "Content-Type: application/json" \
  -d '{"row": 0, "col": 0}'
```

### CLI-style Command
```bash
curl -X POST http://localhost:3000/api/game/{gameId}/command \
  -H "Content-Type: application/json" \
  -d '{"command": "A1"}'
```

### List All Games (Protected)
```bash
# Requires admin key authentication
curl -H "X-Admin-Key: minesweeper-admin-key" http://localhost:8080/api/games
```

> **Note**: The `/api/games` endpoint requires admin key authentication. Provide the admin key via the `X-Admin-Key` or `Authorization` header.

## MCP (Model Context Protocol) Integration

This server supports the Model Context Protocol, allowing AI assistants to interact with the Minesweeper game using natural language. All API endpoints are automatically exposed as MCP tools.

### Quick Setup

1. **Start the server**: `pnpm run dev:server`
2. **Visit MCP page**: Open `http://localhost:8080/mcp` for setup instructions
3. **Configure your AI client** with the SSE endpoint: `http://localhost:8080/mcp/sse`

**Available MCP Tools:**
- `createGame` - Create new Minesweeper game
- `getGameState` - Get current game state
- `revealCell` - Reveal a cell at specified coordinates
- `flagCell` - Flag/unflag a cell
- `executeCommand` - Run text commands like "reveal 3 4"
- `getHealth` - Check server health
- `listGames` - List all games (admin only)

**Example AI Interactions:**
- "Create a 10x10 minesweeper game with 20% bombs"
- "Reveal the cell at row 5, column 3"
- "Flag the cell at position (2, 7)"
- "Show me the current game state"

**Quick Verification:**
```bash
# Check if MCP tools are available
curl http://localhost:8080/mcp/tools
```

For detailed setup instructions, client configuration examples, and troubleshooting, visit the **MCP Integration page** at `http://localhost:8080/mcp` or see [MCP.md](./MCP.md).

## Example Game Flow (CLI)

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

Enter command: A1
```

## Development

### Project Structure
```
src/
├── index.ts           # CLI entry point
├── server.ts          # Web server entry point (includes inline web UI)
├── cli.ts             # CLI interface and user interaction
├── game.ts            # Core game logic
├── serverBoardText.ts # Server-side board rendering
├── types.ts           # TypeScript type definitions
└── logger.ts          # Logging configuration

data/                  # Game data storage (if needed)
```

### Available Scripts

**CLI Development:**
- `pnpm dev`: Run CLI in development mode
- `pnpm dev:watch`: Run CLI with auto-reload
- `pnpm dev:debug`: Run CLI with debug logging
- `pnpm start`: Run compiled CLI

**Server Development:**
- `pnpm dev:server`: Run server in development mode
- `pnpm dev:server:watch`: Run server with auto-reload
- `pnpm start:server`: Run compiled server

**Build:**
- `pnpm build`: Compile TypeScript to JavaScript
- `pnpm clean`: Remove compiled files

## Environment Variables

- `LOG_LEVEL`: Set to `debug` or `trace` for verbose logging (default: `silent`)
- `PORT`: Web server port (default: `3000`)
- `NODE_ENV`: Environment mode (default: `production` in Docker)

## Requirements Implemented

- ✅ Grid of arbitrary dimensions
- ✅ Configurable bomb percentage
- ✅ Two bomb population modes (before/after first click)
- ✅ Terminal-based interface with text coordinates (A1, B2, etc.)
- ✅ Web-based interface with REST API
- ✅ Bomb detection and game over logic
- ✅ Adjacent bomb counting
- ✅ Recursive reveal for empty cells (flood fill)
- ✅ Flag functionality for marking suspected bombs
- ✅ Docker containerization
- ✅ Development and production modes
- ✅ Inline HTML/JS frontend (no build process or separate files required)
- ✅ Responsive web design with mobile support
- ✅ Model Context Protocol (MCP) integration for AI assistant interactions

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 3000
lsof -i :8080

# Use a different port
docker run -p 8081:8080 --rm minesweeper-web
```

### Docker Build Issues
```bash
# Clean build (no cache)
docker build --no-cache -t minesweeper-web .

# Check build logs
docker build -t minesweeper-web . --progress=plain
```

### Frontend Issues
The frontend is completely inline in the server code - no separate files or build process required. If you see a blank page:
1. Check that the root route `/` is properly registered in the server
2. Verify the API endpoints are responding (test `/api/health`)
3. Check browser console for JavaScript errors

### Module Not Found Errors
Make sure you run `pnpm install` and `pnpm build` before starting the application locally.

Enjoy playing Minesweeper! 🎮💣
