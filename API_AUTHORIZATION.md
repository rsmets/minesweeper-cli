# API Authorization

The `/api/games` endpoint requires API key authentication to list all active game sessions. This is implemented using Fastify's preHandler hooks for clean middleware-style authentication.

## Environment Variables

- `ADMIN_KEY`: Admin key for protected endpoints (default: `"minesweeper-admin-key"`)
- `PORT`: Server port (default: `8080`)

## Usage Examples

### Setting Custom API Key

```bash
export ADMIN_KEY="your-secret-admin-key"
npm run start:server
```

### Making Authenticated Requests

#### Using X-Admin-Key Header

```bash
curl -H "X-Admin-Key: minesweeper-admin-key" http://localhost:8080/api/games
```

#### Using Authorization Header

```bash
curl -H "Authorization: minesweeper-admin-key" http://localhost:8080/api/games
```

### Successful Response

```json
{
  "ids": ["uuid1", "uuid2", "uuid3"],
  "total": 3,
  "message": "Active game sessions"
}
```

### Error Response (401 Unauthorized)

```json
{
  "error": "Unauthorized",
  "message": "Valid admin key required. Provide it via 'X-Admin-Key' or 'Authorization' header."
}
```

## Implementation Details

This authorization is implemented using Fastify's `preHandler` hooks, which is the idiomatic way to handle middleware in Fastify:

```javascript
fastify.get(
  "/api/games",
  {
    preHandler: requireAdminKey,
  },
  async (req, reply) => {
    // Handler code here
  },
);
```

Alternative plugin approach for reusable authentication across multiple routes:

```javascript
const adminAuthPlugin = async (fastify) => {
  fastify.addHook("preHandler", async (req, reply) => {
    // Authentication logic here
  });
};

// Usage:
fastify.register(adminAuthPlugin, { prefix: "/admin" });
```

## Security Notes

- The admin key is case-sensitive
- Header names (`X-Admin-Key`, `Authorization`) are case-insensitive in real HTTP
- The default API key should be changed in production environments
- Consider using environment variables or secure configuration management for admin keys
- The `/api/games` endpoint is the only protected endpoint - game creation and gameplay endpoints remain public
- Uses Fastify's built-in hook system for proper request lifecycle management

## Testing Authorization

You can test the authorization functionality by running:

```bash
npm test
```

The test suite includes comprehensive authorization tests covering:
- Valid admin key authentication
- Invalid admin key rejection
- Missing admin key handling
- Header priority (X-Admin-Key takes precedence over Authorization)
- Security considerations (no key exposure in error messages)