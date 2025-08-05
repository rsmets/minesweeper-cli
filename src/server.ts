import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import { MinesweeperGame } from "./game";
import { renderBoardText } from "./serverBoardText";
import { GameConfig, Position, GameStatus } from "./types";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import { routeSchemas } from "./schemas";
import { CellState } from "./types";

// Use require for the MCP plugin to work around module resolution issues
const mcpPlugin = require("@mcp-it/fastify");

const fastify = Fastify({ logger: true });

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf8"),
);
const VERSION = packageJson.version;

// Environment variables:
// - PORT: Server port (default: 8080)
// - ADMIN_KEY: Admin key for protected endpoints
const PORT = process.env.PORT || 8080;
const ADMIN_KEY = process.env.ADMIN_KEY;

// Authorization middleware
// Fastify preHandler hook for admin authentication
const requireAdminKey = async (req: FastifyRequest, reply: FastifyReply) => {
  const adminKey = req.headers["x-admin-key"] || req.headers["authorization"];

  if (!adminKey || adminKey !== ADMIN_KEY) {
    reply.code(401).send({
      error: "Unauthorized",
      message:
        "Valid admin key required. Provide it via 'X-Admin-Key' or 'Authorization' header.",
    });
    return;
  }
};

// In-memory game sessions: { [id]: MinesweeperGame }
const games: Record<string, MinesweeperGame> = {};

// Serve index.html at root - inline HTML to avoid file path issues
fastify.get("/", async (req: FastifyRequest, reply: FastifyReply) => {
  reply.type("text/html").send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minesweeper Web</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px; }
        .container { background: white; border-radius: 15px; padding: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 800px; width: 100%; }
        h1 { color: #333; text-align: center; margin-bottom: 30px; font-size: 2.5em; text-shadow: 2px 2px 4px rgba(0,0,0,0.1); }
        .api-section { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #007bff; }
        .api-section h2 { color: #007bff; margin-bottom: 15px; }
        .endpoint { margin: 10px 0; padding: 15px; background: white; border-radius: 5px; border: 1px solid #e9ecef; }
        .method { display: inline-block; padding: 4px 8px; border-radius: 3px; color: white; font-weight: bold; margin-right: 10px; }
        .get { background: #28a745; }
        .post { background: #007bff; }
        .path { font-family: 'Courier New', monospace; color: #495057; }
        .description { margin-top: 5px; color: #6c757d; font-size: 0.9em; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto; margin: 10px 0; }
        .mcp-info { background: #e7f3ff; border-left-color: #0066cc; }
        .mcp-config { background: #1e1e1e; color: #f8f8f2; padding: 15px; border-radius: 5px; font-family: 'Courier New', monospace; font-size: 0.9em; }
        .copy-btn { background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; float: right; font-size: 0.8em; }
        .copy-btn:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚩 Minesweeper Game Server</h1>

        <div class="api-section mcp-info">
            <h2>🔌 MCP Integration</h2>
            <p>This server now supports the Model Context Protocol (MCP)! Connect AI assistants to play Minesweeper using natural language.</p>

            <h3>MCP Endpoint</h3>
            <pre><strong>SSE Transport:</strong> http://localhost:${PORT}/mcp/sse</pre>

            <h3>Claude Desktop Configuration</h3>
            <div style="position: relative;">
                <button class="copy-btn" onclick="copyConfig()">Copy</button>
                <pre class="mcp-config" id="claude-config">{
  "mcpServers": {
    "minesweeper": {
      "url": "http://localhost:${PORT}/mcp/sse",
      "type": "sse"
    }
  }
}</pre>
            </div>
        </div>

        <div class="api-section">
            <h2>🎮 Available MCP Tools</h2>
            <p>These API endpoints are automatically available as MCP tools:</p>

            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/api/game</span>
                <div class="description">Create a new Minesweeper game with custom dimensions and bomb percentage</div>
            </div>

            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/api/game/:id</span>
                <div class="description">Get the current state of a specific game</div>
            </div>

            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/api/game/:id/reveal</span>
                <div class="description">Reveal a cell at the specified row and column</div>
            </div>

            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/api/game/:id/flag</span>
                <div class="description">Flag or unflag a cell at the specified position</div>
            </div>

            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/api/game/:id/command</span>
                <div class="description">Execute text commands like "reveal 3 4" or "flag 2 5"</div>
            </div>

            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/api/health</span>
                <div class="description">Check server health and status</div>
            </div>
        </div>

        <div class="api-section">
            <h2>📖 Quick Start</h2>
            <pre><strong>Create a game:</strong>
curl -X POST http://localhost:${PORT}/api/game \\
  -H "Content-Type: application/json" \\
  -d '{"width": 8, "height": 8, "bombPercentage": 15}'

<strong>Get game state:</strong>
curl http://localhost:${PORT}/api/game/[game-id]

<strong>Reveal a cell:</strong>
curl -X POST http://localhost:${PORT}/api/game/[game-id]/reveal \\
  -H "Content-Type: application/json" \\
  -d '{"row": 2, "col": 3}'</pre>
        </div>

        <div class="api-section">
            <h2>🤖 AI Assistant Examples</h2>
            <p>Once connected via MCP, you can use natural language:</p>
            <ul>
                <li>"Create a 10x10 minesweeper game with 20% bombs"</li>
                <li>"Reveal the cell at row 5, column 3"</li>
                <li>"Flag the suspicious cell at position (2, 7)"</li>
                <li>"Show me the current game state"</li>
                <li>"What's my current score?"</li>
            </ul>
        </div>
    </div>

    <script>
        function copyConfig() {
            const config = document.getElementById('claude-config');
            navigator.clipboard.writeText(config.textContent).then(() => {
                const btn = document.querySelector('.copy-btn');
                const original = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => btn.textContent = original, 2000);
            });
        }
    </script>
</body>
</html>
  `);
});

// Health check endpoint with proper schema
fastify.get(
  "/api/health",
  {
    schema: routeSchemas.health,
  },
  async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      reply.status(200).send({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: VERSION,
      });
    } catch (error) {
      reply.status(500).send({
        status: "error",
        message: "Health check failed",
      });
    }
  },
);

// Create new game endpoint with proper schema
fastify.post<{ Body: GameConfig }>(
  "/api/game",
  {
    schema: routeSchemas.createGame,
  },
  async (req: FastifyRequest<{ Body: GameConfig }>, reply: FastifyReply) => {
    const config = req.body;

    // Validate configuration
    const errors: string[] = [];

    if (!config.width || config.width < 3 || config.width > 50) {
      errors.push("Width must be between 3 and 50");
    }
    if (!config.height || config.height < 3 || config.height > 50) {
      errors.push("Height must be between 3 and 50");
    }
    if (
      !config.bombPercentage ||
      config.bombPercentage < 1 ||
      config.bombPercentage > 99
    ) {
      errors.push("Bomb percentage must be between 1 and 99");
    }

    if (errors.length > 0) {
      return reply
        .code(400)
        .send({ error: "Invalid configuration", details: errors });
    }

    const gameId = randomUUID();
    const game = new MinesweeperGame(config);
    games[gameId] = game;

    const gameState = game.getGameState();
    reply.code(201).send({
      id: gameId,
      config: game.getConfig(),
      status: gameState.status,
      board: renderBoardText(game.getConfig(), gameState),
      flags: gameState.grid
        .flat()
        .filter((cell) => cell.state === CellState.FLAGGED).length,
      remainingCells: gameState.totalSafeCells - gameState.revealedCells,
    });
  },
);

// Get game state endpoint with proper schema
fastify.get<{ Params: { id: string } }>(
  "/api/game/:id",
  {
    schema: routeSchemas.getGameState,
  },
  async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const game = games[req.params.id];
    if (!game) return reply.code(404).send({ error: "Game not found" });

    const gameState = game.getGameState();
    reply.send({
      id: req.params.id,
      config: game.getConfig(),
      status: gameState.status,
      board: renderBoardText(game.getConfig(), gameState),
      flags: gameState.grid
        .flat()
        .filter((cell) => cell.state === CellState.FLAGGED).length,
      remainingCells: gameState.totalSafeCells - gameState.revealedCells,
    });
  },
);

// Reveal cell endpoint with proper schema
fastify.post<{ Params: { id: string }; Body: Position }>(
  "/api/game/:id/reveal",
  {
    schema: routeSchemas.revealCell,
  },
  async (
    req: FastifyRequest<{ Params: { id: string }; Body: Position }>,
    reply: FastifyReply,
  ) => {
    const game = games[req.params.id];
    if (!game) return reply.code(404).send({ error: "Game not found" });

    const { row, col } = req.body as Position;

    // Validate position
    const config = game.getConfig();
    if (row < 0 || row >= config.height || col < 0 || col >= config.width) {
      return reply.code(400).send({ error: "Invalid position" });
    }

    const success = game.revealCell({ row, col });
    if (!success) {
      return reply.code(400).send({
        error: "Cannot reveal cell - it may already be revealed or flagged",
      });
    }

    const gameState = game.getGameState();
    reply.send({
      id: req.params.id,
      config: game.getConfig(),
      status: gameState.status,
      board: renderBoardText(game.getConfig(), gameState),
      flags: gameState.grid
        .flat()
        .filter((cell) => cell.state === CellState.FLAGGED).length,
      remainingCells: gameState.totalSafeCells - gameState.revealedCells,
    });
  },
);

// Flag cell endpoint with proper schema
fastify.post<{ Params: { id: string }; Body: Position }>(
  "/api/game/:id/flag",
  {
    schema: routeSchemas.flagCell,
  },
  async (
    req: FastifyRequest<{ Params: { id: string }; Body: Position }>,
    reply: FastifyReply,
  ) => {
    const game = games[req.params.id];
    if (!game) return reply.code(404).send({ error: "Game not found" });

    const { row, col } = req.body as Position;

    // Validate position
    const config = game.getConfig();
    if (row < 0 || row >= config.height || col < 0 || col >= config.width) {
      return reply.code(400).send({ error: "Invalid position" });
    }

    const success = game.toggleFlag({ row, col });
    if (!success) {
      return reply
        .code(400)
        .send({ error: "Cannot flag cell - it may already be revealed" });
    }

    const gameState = game.getGameState();
    reply.send({
      id: req.params.id,
      config: game.getConfig(),
      status: gameState.status,
      board: renderBoardText(game.getConfig(), gameState),
      flags: gameState.grid
        .flat()
        .filter((cell) => cell.state === CellState.FLAGGED).length,
      remainingCells: gameState.totalSafeCells - gameState.revealedCells,
    });
  },
);

// List games endpoint (admin only) with proper schema
fastify.get(
  "/api/games",
  {
    schema: routeSchemas.listGames,
    preHandler: requireAdminKey,
  },
  async (req: FastifyRequest, reply: FastifyReply) => {
    reply.send({
      ids: Object.keys(games),
      total: Object.keys(games).length,
      message: "Active game sessions",
    });
  },
);

// Command endpoint with proper schema
fastify.post<{ Params: { id: string }; Body: { command: string } }>(
  "/api/game/:id/command",
  {
    schema: routeSchemas.executeCommand,
  },
  async (
    req: FastifyRequest<{ Params: { id: string }; Body: { command: string } }>,
    reply: FastifyReply,
  ) => {
    const game = games[req.params.id];
    if (!game) return reply.code(404).send({ error: "Game not found" });

    const input = req.body.command.trim();
    let message = "";

    try {
      const parts = input.toLowerCase().split(/\s+/);
      const action = parts[0];
      const row = parseInt(parts[1], 10);
      const col = parseInt(parts[2], 10);

      if (isNaN(row) || isNaN(col)) {
        return reply.code(400).send({
          error: "Invalid command format. Use: 'reveal 3 4' or 'flag 2 5'",
        });
      }

      const config = game.getConfig();
      if (row < 0 || row >= config.height || col < 0 || col >= config.width) {
        return reply.code(400).send({ error: "Position out of bounds" });
      }

      let success = false;
      switch (action) {
        case "reveal":
        case "r":
          success = game.revealCell({ row, col });
          message = success
            ? `Revealed cell at (${row}, ${col})`
            : `Cannot reveal cell at (${row}, ${col}) - it may already be revealed or flagged`;
          break;
        case "flag":
        case "f":
          success = game.toggleFlag({ row, col });
          message = success
            ? `Toggled flag at (${row}, ${col})`
            : `Cannot flag cell at (${row}, ${col}) - it may already be revealed`;
          break;
        default:
          return reply
            .code(400)
            .send({ error: "Unknown command. Use 'reveal' or 'flag'" });
      }

      if (!success) {
        return reply.code(400).send({ error: message });
      }

      const gameState = game.getGameState();
      reply.send({
        message,
        gameState: {
          id: req.params.id,
          config: game.getConfig(),
          status: gameState.status,
          board: renderBoardText(game.getConfig(), gameState),
          flags: gameState.grid
            .flat()
            .filter((cell) => cell.state === CellState.FLAGGED).length,
          remainingCells: gameState.totalSafeCells - gameState.revealedCells,
        },
      });
    } catch (error) {
      reply.code(400).send({ error: (error as Error).message });
    }
  },
);

async function startServer() {
  try {
    // Register the MCP plugin with proper configuration
    await fastify.register(mcpPlugin, {
      name: "Minesweeper Game Server",
      description:
        "MCP-enabled Minesweeper game API with tools for creating and playing games",
      mountPath: "/mcp",
      addDebugEndpoint: true,
    });

    const address = await fastify.listen({
      port: Number(PORT),
      host: "0.0.0.0",
    });

    fastify.log.info(`Server listening at ${address}`);
    fastify.log.info(`MCP SSE server available at ${address}/mcp/sse`);
    fastify.log.info(`MCP debug endpoint available at ${address}/mcp/debug`);
    console.log(`\n🎮 Minesweeper Server Ready!`);
    console.log(`📍 Web UI: ${address}`);
    console.log(`🔌 MCP Endpoint: ${address}/mcp/sse`);
    console.log(`🐛 Debug Tools: ${address}/mcp/debug`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

startServer();
