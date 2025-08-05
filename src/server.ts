import Fastify, { FastifyRequest, FastifyReply } from "fastify";
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
        .container { background: rgba(255, 255, 255, 0.95); border-radius: 15px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); padding: 30px; max-width: 800px; width: 100%; }
        h1 { text-align: center; color: #333; margin-bottom: 20px; font-size: 2.5em; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1); }
        .game-controls { display: flex; gap: 10px; margin-bottom: 20px; justify-content: center; flex-wrap: wrap; }
        .config-group { display: flex; flex-direction: column; align-items: center; gap: 5px; }
        .config-group label { font-weight: bold; color: #555; font-size: 0.9em; }
        .config-group input { width: 80px; padding: 8px; border: 2px solid #ddd; border-radius: 5px; text-align: center; font-size: 1em; }
        button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 1em; font-weight: bold; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); }
        button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3); }
        button:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .board-container { background: #1a1a1a; border-radius: 10px; padding: 20px; margin: 20px 0; box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.3); }
        .board { color: #00ff00; font-family: 'Courier New', monospace; font-size: 1.1em; line-height: 1.4; white-space: pre; text-align: center; min-height: 200px; display: flex; align-items: center; justify-content: center; }
        .command-section { display: flex; gap: 10px; margin: 20px 0; justify-content: center; }
        #commandInput { flex: 1; max-width: 300px; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 1.1em; font-family: 'Courier New', monospace; }
        .message { text-align: center; min-height: 50px; display: flex; align-items: center; justify-content: center; font-size: 1.1em; font-weight: bold; color: #e74c3c; background: rgba(231, 76, 60, 0.1); border-radius: 8px; padding: 10px; margin: 10px 0; }
        .message.success { color: #27ae60; background: rgba(39, 174, 96, 0.1); }
        .message.info { color: #3498db; background: rgba(52, 152, 219, 0.1); }
        .instructions { background: rgba(52, 152, 219, 0.1); border-left: 4px solid #3498db; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .instructions h3 { color: #3498db; margin-bottom: 10px; }
        .instructions p { margin: 5px 0; color: #555; }
        @media (max-width: 600px) { .container { padding: 20px; margin: 10px; } h1 { font-size: 2em; } .board { font-size: 0.9em; } .game-controls { flex-direction: column; align-items: center; } .command-section { flex-direction: column; } #commandInput { max-width: none; } }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎮 Minesweeper Web 💣</h1>
        <div class="game-controls">
            <div class="config-group">
                <label for="width">Width</label>
                <input type="number" id="width" value="10" min="3" max="50">
            </div>
            <div class="config-group">
                <label for="height">Height</label>
                <input type="number" id="height" value="10" min="3" max="50">
            </div>
            <div class="config-group">
                <label for="bombPercentage">Bombs %</label>
                <input type="number" id="bombPercentage" value="15" min="5" max="40" step="0.1">
            </div>
            <button onclick="createNewGame()">New Game</button>
        </div>
        <div class="board-container">
            <div id="board" class="board">Click "New Game" to start playing!</div>
        </div>
        <div class="command-section">
            <input type="text" id="commandInput" placeholder="Enter command (e.g., A1, F B2, Q)" autocomplete="off">
            <button onclick="submitCommand()">Send Command</button>
        </div>
        <div id="message" class="message"></div>
        <div class="instructions">
            <h3>📋 How to Play:</h3>
            <p><strong>Reveal cell:</strong> Type coordinates like "A1", "B5", "C10"</p>
            <p><strong>Flag/Unflag:</strong> Type "F A1", "F B5", etc.</p>
            <p><strong>Quit game:</strong> Type "Q" or "QUIT"</p>
            <p><strong>Goal:</strong> Reveal all cells without bombs to win!</p>
        </div>
    </div>
    <script>
        let gameId = '';
        let isLoading = false;
        let gameActive = false;

        async function createNewGame() {
            if (isLoading) return;
            setLoading(true);
            const width = parseInt(document.getElementById('width').value);
            const height = parseInt(document.getElementById('height').value);
            const bombPercentage = parseFloat(document.getElementById('bombPercentage').value);
            if (width < 3 || width > 50 || height < 3 || height > 50 || bombPercentage < 5 || bombPercentage > 40) {
                let errorMsg = 'Invalid configuration: ';
                const errors = [];
                if (width < 3 || width > 50) errors.push('Width must be 3-50');
                if (height < 3 || height > 50) errors.push('Height must be 3-50');
                if (bombPercentage < 5 || bombPercentage > 40) errors.push('Bombs must be 5-40%');
                showMessage(errorMsg + errors.join(', '), 'error');
                setLoading(false);
                return;
            }
            try {
                const response = await fetch('/api/game', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ width, height, bombPercentage })
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMsg = errorData.details ?
                        'Configuration error: ' + errorData.details.join(', ') :
                        'Failed to create game';
                    throw new Error(errorMsg);
                }
                const data = await response.json();
                gameId = data.id;
                gameActive = true;
                await refreshBoard();
                showMessage('Game started! Enter your first command.', 'success');
                document.getElementById('commandInput').focus();
            } catch (error) {
                showMessage('Error creating game: ' + error.message, 'error');
            } finally {
                setLoading(false);
            }
        }

        async function submitCommand() {
            const input = document.getElementById('commandInput');
            const command = input.value.trim().toUpperCase();
            if (!command || !gameId || isLoading || !gameActive) return;
            setLoading(true);
            try {
                const response = await fetch(\`/api/game/\${gameId}/command\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command })
                });
                if (!response.ok) throw new Error('Failed to execute command');
                const data = await response.json();
                document.getElementById('board').textContent = data.boardText || '';
                showMessage(data.message || '', data.status === 'WON' ? 'success' : 'info');
                if (data.status === 'WON') {
                    showMessage('🎉 Congratulations! You won! 🎉', 'success');
                    gameActive = false;
                } else if (data.status === 'LOST') {
                    showMessage('💥 Game Over! You hit a bomb! 💥', 'error');
                    gameActive = false;
                } else if (data.status === 'QUIT') {
                    showMessage('Game quit.', 'info');
                    gameActive = false;
                }
                input.value = '';
            } catch (error) {
                showMessage('Error executing command: ' + error.message, 'error');
            } finally {
                setLoading(false);
            }
        }

        async function refreshBoard() {
            if (!gameId) return;
            try {
                const response = await fetch(\`/api/game/\${gameId}/command\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command: '' })
                });
                if (response.ok) {
                    const data = await response.json();
                    document.getElementById('board').textContent = data.boardText || '';
                }
            } catch (error) {
                console.error('Error refreshing board:', error);
            }
        }

        function showMessage(text, type = 'info') {
            const messageEl = document.getElementById('message');
            messageEl.textContent = text;
            messageEl.className = \`message \${type}\`;
        }

        function setLoading(loading) {
            isLoading = loading;
            const buttons = document.querySelectorAll('button');
            const inputs = document.querySelectorAll('input');
            buttons.forEach(btn => btn.disabled = loading);
            inputs.forEach(input => input.disabled = loading);
        }

        // DOM ready check - works for both cached and uncached loads
        function initializeApp() {
            // Add Enter key listener for command input
            const commandInput = document.getElementById('commandInput');
            if (commandInput) {
                commandInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        submitCommand();
                    }
                });
            }

            // Auto-start a game after a brief delay
            setTimeout(createNewGame, 100);
        }

        // Use multiple DOM ready strategies to ensure it works with caching
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            // DOM is already ready (cached scenario)
            initializeApp();
        } else {
            // DOM is still loading (first load scenario)
            document.addEventListener('DOMContentLoaded', initializeApp);
        }
    </script>
</body>
</html>
  `);
});

// Health check - robust for Fly.io
fastify.get("/api/health", async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    reply.status(200).send({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "1.0.0",
    });
  } catch (error) {
    reply.status(500).send({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Additional health check routes for Fly.io compatibility
fastify.get("/health", async (req: FastifyRequest, reply: FastifyReply) => {
  reply.status(200).send({ status: "healthy" });
});

fastify.get("/healthz", async (req: FastifyRequest, reply: FastifyReply) => {
  reply.status(200).send({ status: "ok" });
});

// Debug route for deployment troubleshooting
fastify.get(
  "/api/debug",
  async (_req: FastifyRequest, _reply: FastifyReply) => {
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
  },
);

// Create new game
fastify.post<{ Body: GameConfig }>(
  "/api/game",
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
      config.bombPercentage < 5 ||
      config.bombPercentage > 40
    ) {
      errors.push("Bomb percentage must be between 5% and 40%");
    }

    if (errors.length > 0) {
      return reply.code(400).send({
        error: "Invalid configuration",
        details: errors,
        validRanges: {
          width: "3-50",
          height: "3-50",
          bombPercentage: "5-40",
        },
      });
    }

    const id = randomUUID();
    games[id] = new MinesweeperGame(config);
    reply.code(201).send({ id });
  },
);

// Get game state
fastify.get<{ Params: { id: string } }>(
  "/api/game/:id",
  async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const game = games[req.params.id];
    if (!game) return reply.code(404).send({ error: "Game not found" });
    reply.send({
      id: req.params.id,
      config: game.getConfig(),
      state: game.getGameState(),
    });
  },
);

// Reveal cell
fastify.post<{ Params: { id: string }; Body: Position }>(
  "/api/game/:id/reveal",
  async (
    req: FastifyRequest<{ Params: { id: string }; Body: Position }>,
    reply: FastifyReply,
  ) => {
    const game = games[req.params.id];
    if (!game) return reply.code(404).send({ error: "Game not found" });

    const { row, col } = req.body as Position;

    // Validate position
    if (typeof row !== "number" || typeof col !== "number") {
      return reply.code(400).send({
        error: "Invalid position",
        details: "Row and column must be numbers",
      });
    }

    const config = game.getConfig();
    if (row < 0 || row >= config.height || col < 0 || col >= config.width) {
      return reply.code(400).send({
        error: "Position out of bounds",
        details: `Row must be 0-${config.height - 1}, column must be 0-${config.width - 1}`,
      });
    }

    const ok = game.revealCell({ row, col });
    if (!ok) {
      return reply.code(400).send({
        error: "Cannot reveal cell",
        details: "Cell may already be revealed or flagged",
      });
    }

    reply.send({ ok, state: game.getGameState() });
  },
);

// Toggle flag
fastify.post<{ Params: { id: string }; Body: Position }>(
  "/api/game/:id/flag",
  async (
    req: FastifyRequest<{ Params: { id: string }; Body: Position }>,
    reply: FastifyReply,
  ) => {
    const game = games[req.params.id];
    if (!game) return reply.code(404).send({ error: "Game not found" });

    const { row, col } = req.body as Position;

    // Validate position
    if (typeof row !== "number" || typeof col !== "number") {
      return reply.code(400).send({
        error: "Invalid position",
        details: "Row and column must be numbers",
      });
    }

    const config = game.getConfig();
    if (row < 0 || row >= config.height || col < 0 || col >= config.width) {
      return reply.code(400).send({
        error: "Position out of bounds",
        details: `Row must be 0-${config.height - 1}, column must be 0-${config.width - 1}`,
      });
    }

    const ok = game.toggleFlag({ row, col });
    if (!ok) {
      return reply.code(400).send({
        error: "Cannot toggle flag",
        details: "Cell may already be revealed",
      });
    }

    reply.send({ ok, state: game.getGameState() });
  },
);

// List all active games (IDs only)
fastify.get("/api/games", async (_req: FastifyRequest, reply: FastifyReply) => {
  reply.send({ ids: Object.keys(games) });
});

// CLI-style command endpoint: accepts commands like 'A1', 'F B2', 'Q', etc.
fastify.post<{ Params: { id: string }; Body: { command: string } }>(
  "/api/game/:id/command",
  async (
    req: FastifyRequest<{ Params: { id: string }; Body: { command: string } }>,
    reply: FastifyReply,
  ) => {
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

      // Validate position
      const config = game.getConfig();
      if (row < 0 || row >= config.height || col < 0 || col >= config.width) {
        message = `Position ${flagMatch[1].toUpperCase()}${flagMatch[2]} is out of bounds. Valid range: A1-${String.fromCharCode(65 + config.width - 1)}${config.height}`;
      } else {
        ok = game.toggleFlag({ row, col });
        message = ok
          ? `Flag toggled at ${flagMatch[1].toUpperCase()}${flagMatch[2]}`
          : `Cannot flag ${flagMatch[1].toUpperCase()}${flagMatch[2]} - cell may already be revealed`;
      }
      status = game.getGameState().status;
    } else if (revealMatch) {
      const col =
        revealMatch[1].toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
      const row = parseInt(revealMatch[2], 10) - 1;

      // Validate position
      const config = game.getConfig();
      if (row < 0 || row >= config.height || col < 0 || col >= config.width) {
        message = `Position ${revealMatch[1].toUpperCase()}${revealMatch[2]} is out of bounds. Valid range: A1-${String.fromCharCode(65 + config.width - 1)}${config.height}`;
      } else {
        ok = game.revealCell({ row, col });
        message = ok
          ? `Revealed ${revealMatch[1].toUpperCase()}${revealMatch[2]}`
          : `Cannot reveal ${revealMatch[1].toUpperCase()}${revealMatch[2]} - cell may already be revealed or flagged`;
      }
      status = game.getGameState().status;
    } else if (input === "") {
      // Empty command for initial board display
      message = "Enter a command like A1 to reveal, F A1 to flag, or Q to quit";
    } else {
      const config = game.getConfig();
      message = `Invalid command "${input}". Valid commands: A1-${String.fromCharCode(65 + config.width - 1)}${config.height} to reveal, F A1-${String.fromCharCode(65 + config.width - 1)}${config.height} to flag, Q to quit`;
    }

    // Always return the board in CLI-style text
    const boardText = renderBoardText(game.getConfig(), game.getGameState());
    reply.send({ boardText, message, status });
  },
);

const port = process.env.PORT || 8080;

fastify.listen(
  { port: Number(port), host: "0.0.0.0" },
  (err: Error | null, address: string) => {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    fastify.log.info(`Server listening at ${address}`);
  },
);
