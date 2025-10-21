import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import { readFileSync } from "fs";
import { join } from "path";
import routesPlugin from "./routes";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import cors from "@fastify/cors";
import staticFiles from "@fastify/static";

// Use require for the MCP plugin to work around module resolution issues
const mcpPlugin = require("@mcp-it/fastify");

// Create Fastify instance with built-in logger
const fastify = Fastify({ logger: true });

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf8")
);
const VERSION = packageJson.version;
const APP_NAME = packageJson.name;

// Environment variables:
// - PORT: Server port (default: 8080)
// - ADMIN_KEY: Admin key for protected endpoints
const PORT = process.env.PORT || 8080;

/**
 * Root endpoint - serves a simple landing page
 * In production, you might serve a full frontend application here
 */
fastify.get("/", async (req: FastifyRequest, reply: FastifyReply) => {
  reply.type("text/html").send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${APP_NAME}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            min-height: 100vh; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            padding: 20px; 
        }
        .container { 
            background: rgba(255, 255, 255, 0.95); 
            border-radius: 15px; 
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); 
            padding: 40px; 
            max-width: 600px; 
            width: 100%; 
        }
        h1 { 
            text-align: center; 
            color: #333; 
            margin-bottom: 20px; 
            font-size: 2.5em; 
        }
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
            font-size: 1.1em;
        }
        .nav-links { 
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin: 30px 0;
        }
        .nav-links a { 
            color: white;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            text-decoration: none; 
            padding: 15px 25px;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        .nav-links a:hover { 
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }
        .info-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box h3 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 1.1em;
        }
        .info-box p {
            color: #555;
            line-height: 1.6;
        }
        .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #e9ecef; 
            color: #6c757d; 
            font-size: 0.9em; 
        }
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 ${APP_NAME}</h1>
        <p class="subtitle">Fastify API Boilerplate with MCP Integration</p>

        <div class="info-box">
            <h3>📦 Features</h3>
            <p>
                This boilerplate includes Fastify, TypeScript, authorization middleware, 
                Zod validation, Swagger/OpenAPI docs, and Model Context Protocol (MCP) integration.
            </p>
        </div>

        <div class="nav-links">
            <a href="/api/health">API Health Check</a>
            <a href="/documentation" target="_blank">API Documentation (Swagger)</a>
            <a href="/mcp">MCP Integration Info</a>
        </div>

        <div class="info-box">
            <h3>🔐 Authentication</h3>
            <p>
                Some endpoints require an admin key. Set the <code>ADMIN_KEY</code> environment 
                variable and include it in requests via the <code>X-Admin-Key</code> or 
                <code>Authorization</code> header.
            </p>
        </div>

        <div class="footer">
            ${APP_NAME} v${VERSION} | Built with <a href="https://fastify.dev" target="_blank" style="color: #667eea;">Fastify</a>
        </div>
    </div>
</body>
</html>
  `);
});

/**
 * MCP information page
 * Explains how to connect AI assistants via the Model Context Protocol
 */
fastify.get("/mcp", async (req: FastifyRequest, reply: FastifyReply) => {
  // Construct the server URL dynamically
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const host = req.hostname;
  const port = process.env.NODE_ENV === "production" ? "" : `:${PORT}`;
  const serverUrl = `${protocol}://${host}${port}`;

  reply.type("text/html").send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MCP Integration - ${APP_NAME}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            min-height: 100vh; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            padding: 20px; 
        }
        .container { 
            background: white; 
            border-radius: 15px; 
            padding: 40px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1); 
            max-width: 900px; 
            width: 100%; 
        }
        h1 { 
            color: #333; 
            text-align: center; 
            margin-bottom: 30px; 
            font-size: 2.5em; 
        }
        .nav-links { 
            text-align: center; 
            margin-bottom: 30px; 
        }
        .nav-links a { 
            color: #667eea; 
            text-decoration: none; 
            margin: 0 15px; 
            font-weight: bold; 
        }
        .nav-links a:hover { 
            text-decoration: underline; 
        }
        .api-section { 
            margin: 20px 0; 
            padding: 20px; 
            background: #f8f9fa; 
            border-radius: 8px; 
            border-left: 4px solid #667eea; 
        }
        .api-section h2 { 
            color: #667eea; 
            margin-bottom: 15px; 
        }
        .api-section h3 { 
            color: #555; 
            margin: 15px 0 10px; 
        }
        .api-section p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 10px;
        }
        pre { 
            background: #f4f4f4; 
            padding: 15px; 
            border-radius: 5px; 
            overflow-x: auto; 
            margin: 10px 0; 
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        .mcp-config { 
            background: #1e1e1e; 
            color: #f8f8f2; 
            padding: 15px; 
            border-radius: 5px; 
            font-family: 'Courier New', monospace; 
            font-size: 0.9em; 
            position: relative;
        }
        .copy-btn { 
            background: #667eea; 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 0.9em;
            margin-top: 10px;
            transition: all 0.3s ease;
        }
        .copy-btn:hover { 
            background: #5568d3; 
        }
        .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #e9ecef; 
            color: #6c757d; 
            font-size: 0.9em; 
        }
        ul {
            margin: 15px 0;
            padding-left: 20px;
        }
        li {
            margin: 8px 0;
            color: #555;
        }
        a {
            color: #667eea;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔌 MCP Integration</h1>

        <div class="nav-links">
            <a href="/">Home</a>
            <a href="/api/health">API Health</a>
            <a href="/documentation" target="_blank">API Docs</a>
        </div>

        <div class="api-section">
            <h2>🤖 Model Context Protocol</h2>
            <p>
                This server supports the Model Context Protocol (MCP)! Connect AI assistants 
                like Claude (via Windsurf IDE) to interact with your API using natural language.
            </p>

            <h3>MCP Endpoint</h3>
            <pre><strong>SSE Transport:</strong> ${serverUrl}/mcp/sse</pre>

            <h3>Windsurf IDE Configuration</h3>
            <p>Add this configuration to your Windsurf MCP settings:</p>
            <pre class="mcp-config">{
  "mcpServers": {
    "${APP_NAME}": {
      "serverUrl": "${serverUrl}/mcp/sse"
    }
  }
}</pre>
            <button class="copy-btn" onclick="copyConfig()">Copy Configuration</button>
        </div>

        <div class="api-section">
            <h2>🛠️ Available MCP Tools</h2>
            <p>These tools are automatically exposed when connected via MCP:</p>
            <ul>
                <li><strong>getHealth</strong> - Check server health and status</li>
                <li><strong>createItem</strong> - Create a new item with name and description</li>
                <li><strong>getItem</strong> - Get a specific item by ID</li>
                <li><strong>listItems</strong> - List all items (admin only)</li>
                <li><strong>updateItem</strong> - Update an existing item</li>
                <li><strong>deleteItem</strong> - Delete an item (admin only)</li>
            </ul>
        </div>

        <div class="api-section">
            <h2>💬 AI Assistant Examples</h2>
            <p>Once connected via MCP, you can use natural language:</p>
            <ul>
                <li>"Create a new item called 'My First Item' with description 'Testing the API'"</li>
                <li>"Show me all items in the system"</li>
                <li>"Get the item with ID xyz-123-abc"</li>
                <li>"Update item xyz-123 to have name 'Updated Name'"</li>
                <li>"Check the server health"</li>
            </ul>
        </div>

        <div class="api-section">
            <h2>🔗 Useful Links</h2>
            <ul>
                <li><a href="/mcp/sse" target="_blank">MCP SSE Endpoint</a></li>
                <li><a href="/mcp/tools" target="_blank">Debug: Available Tools</a></li>
                <li><a href="/documentation" target="_blank">API Swagger Documentation</a></li>
                <li><a href="/api/health" target="_blank">API Health Check</a></li>
                <li><a href="https://github.com/AdirAmsalem/mcp-it" target="_blank">@mcp-it/fastify Plugin</a></li>
                <li><a href="https://modelcontextprotocol.io" target="_blank">MCP Documentation</a></li>
            </ul>
        </div>

        <div class="footer">
            ${APP_NAME} v${VERSION} | <a href="/">Back to Home</a>
        </div>
    </div>

    <script>
        function copyConfig() {
            const config = \`{
  "mcpServers": {
    "${APP_NAME}": {
      "serverUrl": "${serverUrl}/mcp/sse"
    }
  }
}\`;
            navigator.clipboard.writeText(config).then(() => {
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

/**
 * Start the server with all plugins and routes
 */
async function startServer() {
  try {
    // Enable CORS for MCP SSE connections and cross-origin requests
    await fastify.register(cors, {
      // Allow requests from any origin
      // In production, you should restrict this to specific origins
      origin: true,

      // Allow credentials (cookies, authorization headers) to be sent
      // Required for MCP authentication and session management
      credentials: true,

      // Allow specific headers that MCP clients might send
      allowedHeaders: ["Content-Type", "Authorization", "X-Admin-Key"],

      // Specify which HTTP methods are allowed for CORS requests
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    });

    // Register Swagger for API documentation
    await fastify.register(swagger, {
      swagger: {
        info: {
          title: `${APP_NAME} API`,
          description:
            "A Fastify API boilerplate with comprehensive tooling and MCP integration",
          version: VERSION,
        },
        tags: [
          { name: "health", description: "Health check endpoints" },
          { name: "items", description: "Item CRUD operations" },
          { name: "admin", description: "Admin only endpoints" },
        ],
        securityDefinitions: {
          adminKey: {
            type: "apiKey",
            name: "X-Admin-Key",
            in: "header",
            description: "Admin key for protected endpoints",
          },
        },
      },
    });

    // Register Swagger UI for interactive API documentation
    await fastify.register(swaggerUI, {
      routePrefix: "/documentation",
      uiConfig: {
        docExpansion: "list",
        deepLinking: false,
      },
    });

    // Generate swagger documentation when the server is ready
    fastify.ready(() => {
      fastify.swagger();
    });

    // Register static files (for serving assets like images, if needed)
    await fastify.register(staticFiles, {
      root: join(__dirname, "static"),
      prefix: "/static/",
    });

    // Register the MCP plugin before routes
    // This enables Model Context Protocol support for AI assistants
    await fastify.register(mcpPlugin, {
      name: APP_NAME,
      description:
        "Fastify API boilerplate with MCP integration, providing CRUD operations and health checks",
      mountPath: "/mcp",
      addDebugEndpoint: true, // Adds /mcp/tools endpoint for debugging
    });

    // Register routes after MCP plugin so routes are automatically exposed as MCP tools
    await fastify.register(routesPlugin);

    // Start listening on the specified port
    const address = await fastify.listen({
      port: Number(PORT),
      host: "0.0.0.0", // Listen on all network interfaces
    });

    // Log startup information
    fastify.log.info(`Server listening at ${address}`);
    fastify.log.info(`MCP SSE server available at ${address}/mcp/sse`);
    fastify.log.info(`MCP debug endpoint available at ${address}/mcp/tools`);

    console.log(`\n🚀 Server Ready!`);
    console.log(`📍 Web UI: ${address}`);
    console.log(`🔌 MCP Endpoint: ${address}/mcp/sse`);
    console.log(`🐛 Debug Tools: ${address}/mcp/tools`);
    console.log(`📚 API Docs: ${address}/documentation`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Start the server
startServer();
