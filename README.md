# Fastify API Boilerplate

A production-ready Fastify API boilerplate with TypeScript, comprehensive tooling, and Model Context Protocol (MCP) integration. This boilerplate provides a solid foundation for building modern APIs with excellent developer experience.

## 🚀 Features

- **[Fastify](https://fastify.dev)** - Fast and low overhead web framework
- **TypeScript** - Type-safe development with excellent IDE support
- **[Zod](https://zod.dev)** - Schema validation for request/response data
- **[Swagger/OpenAPI](https://swagger.io/)** - Automatic API documentation generation
- **Authorization Middleware** - Built-in admin key authentication
- **[MCP Integration](https://modelcontextprotocol.io)** - Model Context Protocol support for AI assistants
- **[Pino](https://getpino.io/)** - High-performance logging with pretty-printing
- **Docker** - Containerized deployment ready
- **Fly.io** - Production deployment configuration included
- **Node Test Runner** - Built-in testing with Node's native test runner

## 📋 Prerequisites

- Node.js >= 24.5.0
- pnpm (recommended) or npm

## 🛠️ Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd minesweeper-cli

# Install dependencies
pnpm install
```

## 🏃 Running the Application

### Development Mode

```bash
# Start the server with hot-reload
pnpm dev

# Start with debug logging
pnpm dev:debug

# Start with watch mode
pnpm dev:watch
```

The server will start at `http://localhost:8080` by default.

### Production Mode

```bash
# Build the project
pnpm build

# Start the production server
pnpm start
```

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=8080
NODE_ENV=development

# Admin Authentication
ADMIN_KEY=your-secret-admin-key

# Logging
LOG_LEVEL=info  # Options: trace, debug, info, warn, error, silent
```

## 📚 API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8080/documentation
- **Health Check**: http://localhost:8080/api/health
- **MCP Info**: http://localhost:8080/mcp

## 🔌 MCP Integration

This boilerplate includes full support for the Model Context Protocol, allowing AI assistants (like Claude via Windsurf IDE) to interact with your API.

### Configuration for Windsurf IDE

Add this to your Windsurf MCP settings:

```json
{
  "mcpServers": {
    "fastify-api-boilerplate": {
      "serverUrl": "http://localhost:8080/mcp/sse"
    }
  }
}
```

### Available MCP Tools

All API endpoints are automatically exposed as MCP tools:
- `getHealth` - Check server health
- `createItem` - Create a new item
- `getItem` - Get item by ID
- `listItems` - List all items (admin only)
- `updateItem` - Update an item
- `deleteItem` - Delete an item (admin only)

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests in development mode (with tsx)
pnpm test:dev
```

## 🏗️ Project Structure

```
src/
├── server.ts          # Main server setup with Fastify plugins
├── routes.ts          # API route definitions
├── service.ts         # Business logic and data operations
├── schemas.ts         # Zod schemas and Fastify route schemas
├── types.ts           # TypeScript type definitions
├── logger.ts          # Pino logger configuration
└── static/            # Static files (images, etc.)

tests/
└── server-auth.test.ts # Authorization middleware tests

dist/                  # Compiled TypeScript output
```

## 📦 Building and Deployment

### Docker Build

```bash
# Build the Docker image
docker build -t fastify-api-boilerplate .

# Run the container
docker run -p 8080:8080 --env-file .env fastify-api-boilerplate
```

### Fly.io Deployment

```bash
# Login to Fly.io
fly auth login

# Deploy the application
fly deploy

# Set environment variables
fly secrets set ADMIN_KEY=your-secret-key
```

The `fly.toml` configuration is already included and configured for production deployment.

## 🔐 Authorization

Some endpoints require admin authentication. Include the admin key in your requests:

```bash
# Using X-Admin-Key header
curl -H "X-Admin-Key: your-secret-key" http://localhost:8080/api/items

# Using Authorization header
curl -H "Authorization: your-secret-key" http://localhost:8080/api/items
```

## 📝 API Endpoints

### Public Endpoints

- `GET /` - Landing page
- `GET /api/health` - Health check
- `GET /mcp` - MCP integration information
- `POST /api/items` - Create a new item
- `GET /api/items/:id` - Get item by ID
- `PUT /api/items/:id` - Update an item

### Admin-Only Endpoints

- `GET /api/items` - List all items
- `DELETE /api/items/:id` - Delete an item

## 🎨 Customization

### Adding New Routes

1. Define your schemas in `src/schemas.ts`
2. Add route handlers in `src/routes.ts`
3. Implement business logic in `src/service.ts` (or create new service files)
4. Routes are automatically exposed as MCP tools when registered

### Adding Authorization to Routes

```typescript
fastify.get(
  "/api/protected",
  {
    preHandler: requireAdminKey, // Add this middleware
  },
  async (req, reply) => {
    // Your handler code
  }
);
```

## 🔧 Available Scripts

```json
{
  "build": "Build TypeScript and copy static files",
  "clean": "Remove dist directory",
  "dev": "Start development server",
  "dev:debug": "Start with debug logging",
  "dev:watch": "Start with watch mode",
  "dev:watch:debug": "Start watch mode with debug logging",
  "start": "Start production server",
  "test": "Run all tests",
  "test:watch": "Run tests in watch mode",
  "test:dev": "Run tests with tsx"
}
```

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📖 Additional Resources

- [Fastify Documentation](https://fastify.dev)
- [Zod Documentation](https://zod.dev)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Pino Logger](https://getpino.io/)
- [Fly.io Documentation](https://fly.io/docs/)
