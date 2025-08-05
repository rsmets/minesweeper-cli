import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import path from "path";
import { MinesweeperGame } from "./game";
import { renderBoardText } from "./serverBoardText";
import { GameConfig, Position, GameStatus } from "./types";
import { randomUUID } from "crypto";

// __dirname is available in CommonJS

const fastify = Fastify({ logger: true });

// In-memory game sessions: { [id]: MinesweeperGame }
const games: Record<string, MinesweeperGame> = {};

// Serve static frontend
fastify.register(fastifyStatic, {
  root: path.join(__dirname, "../frontend/dist"),
  prefix: "/static/",
});

// Serve index.html at root with fallback
fastify.get("/", async (req, reply) => {
  const fs = require("fs");
  const indexPath = path.join(__dirname, "../frontend/dist/index.html");

  try {
    if (fs.existsSync(indexPath)) {
      const html = fs.readFileSync(indexPath, "utf8");
      reply.type("text/html").send(html);
    } else {
      // Inline HTML fallback if file doesn't exist
      reply.type("text/html").send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minesweeper Web</title>
    <style>
        body { font-family: monospace; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; justify-content: center; align-items: center; }
        .container { background: rgba(255,255,255,0.95); border-radius: 15px; padding: 30px; max-width: 800px; width: 100%; }
        h1 { text-align: center; color: #333; margin-bottom: 20px; }
        .board { background: #1a1a1a; color: #00ff00; padding: 20px; border-radius: 10px; font-family: monospace; white-space: pre; text-align: center; min-height: 200px; }
        .controls { display: flex; gap: 10px; margin: 20px 0; justify-content: center; }
        input, button { padding: 10px; border-radius: 5px; }
        button { background: #667eea; color: white; border: none; cursor: pointer; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎮 Minesweeper Web 💣</h1>
        <div class="controls">
            <input type="number" id="width" value="10" placeholder="Width">
            <input type="number" id="height" value="10" placeholder="Height">
            <input type="number" id="bombs" value="15" placeholder="Bombs %">
            <button onclick="createGame()">New Game</button>
        </div>
        <div id="board" class="board">Click "New Game" to start!</div>
        <div class="controls">
            <input type="text" id="command" placeholder="Enter command (A1, F B2, Q)">
            <button onclick="sendCommand()">Send</button>
        </div>
        <div id="message" style="text-align: center; margin: 10px; color: red;"></div>
    </div>
    <script>
        let gameId = '';
        async function createGame() {
            const width = document.getElementById('width').value || 10;
            const height = document.getElementById('height').value || 10;
            const bombPercentage = document.getElementById('bombs').value || 15;
            try {
                const res = await fetch('/api/game', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({width: +width, height: +height, bombPercentage: +bombPercentage})
                });
                const data = await res.json();
                gameId = data.id;
                await updateBoard();
                document.getElementById('message').textContent = 'Game created! Enter commands like A1, F B2, etc.';
            } catch(e) {
                document.getElementById('message').textContent = 'Error: ' + e.message;
            }
        }
        async function sendCommand() {
            const command = document.getElementById('command').value.trim();
            if (!command || !gameId) return;
            try {
                const res = await fetch(\`/api/game/\${gameId}/command\`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({command})
                });
                const data = await res.json();
                document.getElementById('board').textContent = data.boardText || '';
                document.getElementById('message').textContent = data.message || '';
                document.getElementById('command').value = '';
            } catch(e) {
                document.getElementById('message').textContent = 'Error: ' + e.message;
            }
        }
        async function updateBoard() {
            if (!gameId) return;
            try {
                const res = await fetch(\`/api/game/\${gameId}/command\`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({command: ''})
                });
                const data = await res.json();
                document.getElementById('board').textContent = data.boardText || '';
            } catch(e) { console.error(e); }
        }
        document.getElementById('command').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendCommand();
        });
        window.onload = () => setTimeout(createGame, 500);
    </script>
</body>
</html>
      `);
    }
  } catch (error) {
    reply.code(500).send({ error: "Failed to serve frontend" });
  }
});

// Health check
fastify.get("/api/health", async (_req, _reply) => {
  return { status: "ok" };
});

// Debug route for deployment troubleshooting
fastify.get("/api/debug", async (_req, _reply) => {
  const fs = require("fs");
  const staticPath = path.join(__dirname, "../frontend/dist");
  const indexPath = path.join(staticPath, "index.html");

  return {
    status: "debug",
    __dirname,
    staticPath,
    indexPath,
    indexExists: fs.existsSync(indexPath),
    staticDirExists: fs.existsSync(staticPath),
    staticDirContents: fs.existsSync(staticPath)
      ? fs.readdirSync(staticPath)
      : [],
    cwd: process.cwd(),
    env: {
      PORT: process.env.PORT,
      NODE_ENV: process.env.NODE_ENV,
    },
  };
});

// Create new game
fastify.post<{ Body: GameConfig }>("/api/game", async (req, reply) => {
  const config = req.body;
  const id = randomUUID();
  games[id] = new MinesweeperGame(config);
  reply.code(201).send({ id });
});

// Get game state
fastify.get<{ Params: { id: string } }>("/api/game/:id", async (req, reply) => {
  const game = games[req.params.id];
  if (!game) return reply.code(404).send({ error: "Game not found" });
  reply.send({
    id: req.params.id,
    config: game.getConfig(),
    state: game.getGameState(),
  });
});

// Reveal cell
fastify.post<{ Params: { id: string }; Body: Position }>(
  "/api/game/:id/reveal",
  async (req, reply) => {
    const game = games[req.params.id];
    if (!game) return reply.code(404).send({ error: "Game not found" });
    const { row, col } = req.body as Position;
    const ok = game.revealCell({ row, col });
    reply.send({ ok, state: game.getGameState() });
  },
);

// Toggle flag
fastify.post<{ Params: { id: string }; Body: Position }>(
  "/api/game/:id/flag",
  async (req, reply) => {
    const game = games[req.params.id];
    if (!game) return reply.code(404).send({ error: "Game not found" });
    const { row, col } = req.body as Position;
    const ok = game.toggleFlag({ row, col });
    reply.send({ ok, state: game.getGameState() });
  },
);

// List all active games (IDs only)
fastify.get("/api/games", async (_req, reply) => {
  reply.send({ ids: Object.keys(games) });
});

// CLI-style command endpoint: accepts commands like 'A1', 'F B2', 'Q', etc.
fastify.post<{ Params: { id: string }; Body: { command: string } }>(
  "/api/game/:id/command",
  async (req, reply) => {
    const game = games[req.params.id];
    if (!game) return reply.code(404).send({ error: "Game not found" });
    const input = req.body.command.trim();
    let message = "";
    let status = game.getGameState().status;
    let ok = false;

    // Parse command: 'F <coord>' to flag, '<coord>' to reveal
    const flagMatch = input.match(/^F\s+([A-Z])(\d{1,2})$/i);
    const revealMatch = input.match(/^([A-Z])(\d{1,2})$/i);
    const quitMatch = input.match(/^Q$/i);

    if (quitMatch) {
      message = "Game quit.";
      status = GameStatus.QUIT;
    } else if (flagMatch) {
      const col = flagMatch[1].toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
      const row = parseInt(flagMatch[2], 10) - 1;
      ok = game.toggleFlag({ row, col });
      message = ok
        ? `Flag toggled at ${flagMatch[1].toUpperCase()}${flagMatch[2]}`
        : "Invalid flag action.";
      status = game.getGameState().status;
    } else if (revealMatch) {
      const col =
        revealMatch[1].toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
      const row = parseInt(revealMatch[2], 10) - 1;
      ok = game.revealCell({ row, col });
      message = ok
        ? `Revealed ${revealMatch[1].toUpperCase()}${revealMatch[2]}`
        : "Invalid reveal action.";
      status = game.getGameState().status;
    } else {
      message = "Unknown command. Use e.g. 'A1', 'F B2', or 'Q'.";
    }

    // Always return the board in CLI-style text
    const boardText = renderBoardText(game.getConfig(), game.getGameState());
    reply.send({ boardText, message, status });
  },
);

const port = process.env.PORT || 3000;

fastify.listen({ port: Number(port), host: "0.0.0.0" }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server listening at ${address}`);
});
