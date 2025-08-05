# MCP Integration with @mcp-it/fastify

This document explains how the Minesweeper API has been enhanced with Model Context Protocol (MCP) support using the `@mcp-it/fastify` package.

## What is MCP?

The Model Context Protocol (MCP) is an open standard that enables AI applications to securely connect to data sources and tools. It allows language models to interact with external systems in a standardized way.

## Integration Overview

The Minesweeper API server now includes MCP support through the `@mcp-it/fastify` plugin, which automatically exposes all your existing Fastify API routes as MCP tools that can be used by AI assistants and other MCP clients.

## How It Works

### Automatic Tool Generation

The `@mcp-it/fastify` plugin automatically discovers your Fastify routes and converts them into MCP tools:

1. **Route Discovery**: The plugin scans all registered Fastify routes
2. **Tool Creation**: Each HTTP endpoint becomes an MCP tool
3. **Parameter Mapping**: Route parameters, query strings, and request bodies become tool parameters
4. **Response Handling**: API responses are returned as tool execution results

### Available MCP Tools

Your existing API endpoints are now available as MCP tools:

| API Endpoint | MCP Tool Function | Description |
|--------------|------------------|-------------|
| `GET /api/health` | Health check | Check server status |
| `POST /api/game` | Create game | Create new Minesweeper game |
| `GET /api/game/:id` | Get game state | Retrieve current game state |
| `POST /api/game/:id/reveal` | Reveal cell | Reveal a cell in the game |
| `POST /api/game/:id/flag` | Flag cell | Flag/unflag a cell |
| `POST /api/game/:id/quit` | Quit game | End the current game session |
| `POST /api/game/:id/command` | Execute command | Run text commands |
| `GET /api/games` | List games | List all active games (admin) |

## MCP Server Endpoints

When the server starts with MCP integration, it provides:

- **SSE Endpoint**: `http://localhost:8080/mcp/sse` - Server-Sent Events transport for client connections
- **Messages Endpoint**: `http://localhost:8080/mcp/messages` - POST endpoint for SSE message handling
- **Debug Endpoint**: `http://localhost:8080/mcp/tools` - Lists all available MCP tools (when `addDebugEndpoint: true`)

Note: This server uses SSE (Server-Sent Events) transport only. The plugin also supports streamable HTTP transport, but we use SSE for better compatibility with most MCP clients.

## Client Configuration

### Windsurf IDE

Add this to your Windsurf IDE configuration file:

```json
{
  "mcpServers": {
    "minesweeper": {
      "serverUrl": "http://localhost:8080/mcp/sse"
    }
  }
}
```

While the projct is hosted you can also use:

```json
{
  "mcpServers": {
    "minesweeper": {
      "serverUrl": "https://minesweeper.rest/mcp/sse"
    }
  }
}
```

### Windsurf IDE

For Windsurf IDE, you can configure MCP servers in your settings:

```json
{
  "mcp": {
    "servers": {
      "minesweeper": {
        "serverUrl": "http://localhost:8080/mcp/sse",
      }
    }
  }
}
```

### Custom MCP Client

Using a custom MCP client (like `@modelcontextprotocol/sdk`):

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const client = new Client(
  {
    name: "minesweeper-client",
    version: "1.0.0",
  },
  {
    capabilities: {},
  }
);

const transport = new SSEClientTransport(
  new URL("http://localhost:8080/mcp/sse")
);

await client.connect(transport);

// List available tools
const tools = await client.listTools();
console.log("Available tools:", tools.tools);

// Call a tool
const result = await client.callTool({
  name: "createGame",
  arguments: {
    body: {
      width: 8,
      height: 8,
      bombPercentage: 15
    }
  }
});
```

## Usage Examples

Once connected to an MCP client, you can interact with the Minesweeper game using natural language:

### Creating a Game
> "Create a new minesweeper game with a 10x10 board and 15% bombs"

The AI will call the `createGame` tool with the appropriate parameters.

### Playing the Game
> "Reveal the cell at row 5, column 3 in game abc123"
> "Flag the cell at position (2, 7) in the current game"

The AI will use the `revealCell` and `flagCell` tools with the correct game ID and coordinates.

### Getting Game State
> "Show me the current state of game abc123"
> "What's the status of my minesweeper game?"

The AI will call the `getGameState` tool and format the response for you.

## Technical Implementation

### Server Code Changes

The integration uses a plugin-based architecture to ensure proper MCP registration:

```typescript
// src/server.ts
import Fastify from "fastify";
const mcpPlugin = require("@mcp-it/fastify");
import routesPlugin from "./routes";

const fastify = Fastify({ logger: true });

async function startServer() {
  try {
    // Register the MCP plugin FIRST
    await fastify.register(mcpPlugin, {
      name: "Minesweeper Game Server",
      description: "MCP-enabled Minesweeper game API with tools for creating and playing games",
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
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}
```

### Route Schemas

Each API endpoint includes detailed Fastify schemas that the MCP plugin uses to generate tools:

```typescript
// Example from src/schemas.ts
export const routeSchemas = {
  createGame: {
    operationId: "createGame",
    tags: ["game"],
    summary: "Create new game",
    description: "Create a new Minesweeper game with specified dimensions and bomb percentage",
    body: gameConfigSchema,
    response: {
      201: gameResponseSchema,
      400: validationErrorResponseSchema
    }
  }
};
```

### Package Dependencies

```json
{
  "dependencies": {
    "@mcp-it/fastify": "^0.1.0",
    "fastify": "^5.0.0"
  }
}
```

## Running the MCP-Enabled Server

### Development
```bash
# Start the server with MCP support
pnpm run dev:server

# Or with custom port
PORT=8081 pnpm run dev:server

# Server will be available at:
# - Regular API: http://localhost:8080
# - MCP SSE: http://localhost:8080/mcp/sse
# - MCP Debug: http://localhost:8080/mcp/tools
```

### Production
```bash
# Build and start
pnpm run build
pnpm run start:server

# Or with environment variables
PORT=8080 ADMIN_KEY=your-secret-key pnpm run start:server
```

### Environment Variables
```env
PORT=8080                          # Server port (default: 8080)
ADMIN_KEY=your-secret-admin-key    # Admin key for protected endpoints (optional)
LOG_LEVEL=info                     # Logging level: silent, error, warn, info, debug, trace
NODE_ENV=production                # Environment mode (affects CORS policy)
```

**CORS Configuration:**
- **Development** (`NODE_ENV=development`): Allows CORS from all origins for easy MCP client testing
- **Production** (`NODE_ENV=production`): Restricts CORS to known MCP clients (Claude, Cursor) for security
- **Fly.io Deployment**: Automatically uses production mode with restricted CORS origins

### Verifying MCP Setup

After starting the server, you can verify MCP integration:

```bash
# Check if MCP tools are being generated
curl http://localhost:8080/mcp/tools

# Should return an array of available tools like:
# [
#   {
#     "name": "createGame",
#     "description": "Create a new Minesweeper game...",
#     "inputSchema": { ... }
#   },
#   ...
# ]
```

## Benefits

1. **Zero Configuration**: Existing API routes automatically become MCP tools
2. **Type Safety**: Leverages existing TypeScript types and Fastify schemas
3. **Backwards Compatible**: Regular API continues to work unchanged
4. **AI Integration**: Natural language interface to your Minesweeper game
5. **Standardized**: Uses the open MCP standard for maximum compatibility

## Future Enhancements

Potential improvements for the MCP integration:

1. **Schema Enrichment**: Add OpenAPI/JSON schemas to routes for better tool descriptions
2. **Custom Tool Names**: Use `operationId` in route schemas for friendly tool names (already implemented)
3. **Tool Categories**: Group related tools using route tags
4. **Response Formatting**: Custom formatters for game board visualization
5. **Real-time Updates**: WebSocket integration for live game state updates

## Troubleshooting

### Common Issues

**MCP tools not appearing in client:**
1. Verify the server is running: `curl http://localhost:8080/api/health`
2. Check MCP tools are generated: `curl http://localhost:8080/mcp/tools`
3. Ensure client is connecting to correct URL (note the `/sse` suffix)
4. Check server logs for "MCP plugin registered" message

**CORS/Connection issues:**
- Set `NODE_ENV=development` for local testing to allow all origins
- In production, only Claude and Cursor domains are whitelisted
- Check browser console for CORS errors if using web-based MCP clients

**Server won't start:**
- Port conflict: Change port with `PORT=8081 pnpm run dev:server`
- Dependencies: Run `pnpm install` to ensure all packages are installed
- TypeScript errors: Run `npx tsc --noEmit` to check for compilation issues

**Empty tools array (`[]`) from `/mcp/tools`:**
- Routes may not have proper schemas defined
- MCP plugin might be registered before routes
- Check server startup logs for route registration messages

**Client connection errors:**
- Firewall blocking connections
- Wrong URL format (ensure `/mcp/sse` endpoint)
- CORS issues (if connecting from browser-based client)

### Debug Mode

Enable debug logging to see detailed MCP operation:

```bash
LOG_LEVEL=debug PORT=8080 pnpm run dev:server
```

Look for these log messages:
- `"MCP plugin registered"`
- `"New SSE connection established"`
- Route registration details

### Testing MCP Endpoints

```bash
# Test SSE endpoint (should return SSE headers)
curl -I http://localhost:8080/mcp/sse

# Test tools endpoint
curl http://localhost:8080/mcp/tools | jq .

# Test regular API still works
curl http://localhost:8080/api/health
```

## Related Resources

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [@mcp-it/fastify GitHub Repository](https://github.com/AdirAmsalem/mcp-it)
- [Fastify Documentation](https://fastify.dev/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Desktop MCP Setup](https://docs.anthropic.com/claude/docs/mcp)

## License

This MCP integration follows the same license as the main Minesweeper project.
