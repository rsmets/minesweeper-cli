# API Authorization

The `/api/games` endpoint requires API key authentication to list all active game sessions.

## Environment Variables

- `API_KEY`: API key for protected endpoints (default: `"minesweeper-admin-key"`)
- `PORT`: Server port (default: `8080`)

## Usage Examples

### Setting Custom API Key

```bash
export API_KEY="your-secret-admin-key"
npm run start:server
```

### Making Authenticated Requests

#### Using X-API-Key Header

```bash
curl -H "X-API-Key: minesweeper-admin-key" http://localhost:8080/api/games
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
  "message": "Valid API key required. Provide it via 'X-API-Key' or 'Authorization' header."
}
```

## Security Notes

- The API key is case-sensitive
- Header names (`X-API-Key`, `Authorization`) are case-insensitive in real HTTP
- The default API key should be changed in production environments
- Consider using environment variables or secure configuration management for API keys
- The `/api/games` endpoint is the only protected endpoint - game creation and gameplay endpoints remain public

## Testing Authorization

You can test the authorization functionality by running:

```bash
npm test
```

The test suite includes comprehensive authorization tests covering:
- Valid API key authentication
- Invalid API key rejection
- Missing API key handling
- Header priority (X-API-Key takes precedence over Authorization)
- Security considerations (no key exposure in error messages)