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
