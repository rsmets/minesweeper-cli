import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import { readFileSync } from "fs";
import { join } from "path";
// Use require for the MCP plugin to work around module resolution issues
const mcpPlugin = require("@mcp-it/fastify");
import routesPlugin from "./routes";

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

// Serve game interface at root
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
        .nav-links { text-align: center; margin-bottom: 20px; }
        .nav-links a { color: #667eea; text-decoration: none; margin: 0 15px; font-weight: bold; }
        .nav-links a:hover { text-decoration: underline; }
        @media (max-width: 600px) { .container { padding: 20px; margin: 10px; } h1 { font-size: 2em; } .board { font-size: 0.9em; } .game-controls { flex-direction: column; align-items: center; } .command-section { flex-direction: column; } #commandInput { max-width: none; } }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎮 Minesweeper Web 💣</h1>

        <div class="nav-links">
            <a href="/">Game</a>
            <a href="/mcp">MCP Integration</a>
            <a href="/api/health">API Health</a>
        </div>

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
                document.getElementById('board').textContent = data.board;
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
                if (data.gameState) {
                    document.getElementById('board').textContent = data.gameState.board;
                    showMessage(data.message || '', data.gameState.status === 'WON' ? 'success' : 'info');
                    if (data.gameState.status === 'WON') {
                        showMessage('🎉 Congratulations! You won! 🎉', 'success');
                        gameActive = false;
                    } else if (data.gameState.status === 'LOST') {
                        showMessage('💥 Game Over! You hit a bomb! 💥', 'error');
                        gameActive = false;
                    }
                } else {
                    showMessage(data.message || 'Command executed', 'info');
                }
                input.value = '';
            } catch (error) {
                showMessage('Error executing command: ' + error.message, 'error');
            } finally {
                setLoading(false);
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

// Serve MCP information page
fastify.get("/mcp", async (req: FastifyRequest, reply: FastifyReply) => {
  reply.type("text/html").send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MCP Integration - Minesweeper</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px; }
        .container { background: white; border-radius: 15px; padding: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 800px; width: 100%; }
        h1 { color: #333; text-align: center; margin-bottom: 30px; font-size: 2.5em; text-shadow: 2px 2px 4px rgba(0,0,0,0.1); }
        .nav-links { text-align: center; margin-bottom: 30px; }
        .nav-links a { color: #667eea; text-decoration: none; margin: 0 15px; font-weight: bold; }
        .nav-links a:hover { text-decoration: underline; }
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
        <h1>🔌 MCP Integration</h1>

        <div class="nav-links">
            <a href="/">Game</a>
            <a href="/mcp">MCP Integration</a>
            <a href="/api/health">API Health</a>
        </div>

        <div class="api-section mcp-info">
            <h2>🤖 Model Context Protocol</h2>
            <p>This server supports the Model Context Protocol (MCP)! Connect AI assistants to play Minesweeper using natural language.</p>

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

        <div class="api-section">
            <h2>🔗 Useful Links</h2>
            <ul>
                <li><a href="/mcp/sse" target="_blank">MCP SSE Endpoint</a></li>
                <li><a href="/mcp/tools" target="_blank">Debug: Available Tools</a></li>
                <li><a href="/api/health" target="_blank">API Health Check</a></li>
                <li><a href="https://github.com/AdirAmsalem/mcp-it" target="_blank">@mcp-it/fastify Plugin</a></li>
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

async function startServer() {
  try {
    // Register the MCP plugin FIRST
    await fastify.register(mcpPlugin, {
      name: "Minesweeper Game Server",
      description:
        "MCP-enabled Minesweeper game API with tools for creating and playing games",
      mountPath: "/mcp",
      addDebugEndpoint: true,
    });

    // Register routes AFTER MCP plugin
    await fastify.register(routesPlugin);

    const address = await fastify.listen({
      port: Number(PORT),
      host: "0.0.0.0",
    });

    fastify.log.info(`Server listening at ${address}`);
    fastify.log.info(`MCP SSE server available at ${address}/mcp/sse`);
    fastify.log.info(`MCP debug endpoint available at ${address}/mcp/tools`);
    console.log(`\n🎮 Minesweeper Server Ready!`);
    console.log(`📍 Web UI: ${address}`);
    console.log(`🔌 MCP Endpoint: ${address}/mcp/sse`);
    console.log(`🐛 Debug Tools: ${address}/mcp/tools`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

startServer();
