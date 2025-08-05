// API Schemas

// Base position schema for row/column coordinates
export const positionSchema = {
  type: "object",
  required: ["row", "col"],
  properties: {
    row: {
      type: "number",
      minimum: 0,
      description: "Row coordinate (0-based)",
    },
    col: {
      type: "number",
      minimum: 0,
      description: "Column coordinate (0-based)",
    },
  },
} as const;

// Game configuration schema
export const gameConfigSchema = {
  type: "object",
  required: ["width", "height", "bombPercentage"],
  properties: {
    width: {
      type: "number",
      minimum: 3,
      maximum: 50,
      description: "Board width (3-50)",
    },
    height: {
      type: "number",
      minimum: 3,
      maximum: 50,
      description: "Board height (3-50)",
    },
    bombPercentage: {
      type: "number",
      minimum: 1,
      maximum: 99,
      description: "Percentage of cells that contain bombs (1-99)",
    },
  },
} as const;

// Game response schema
export const gameResponseSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
      description: "Unique game identifier",
    },
    config: {
      ...gameConfigSchema,
      description: "Game configuration",
    },
    status: {
      type: "string",
      enum: ["playing", "won", "lost"],
      description: "Current game status",
    },
    board: {
      type: "string",
      description: "ASCII representation of the game board",
    },
    flags: {
      type: "number",
      description: "Number of flags placed",
    },
    remainingCells: {
      type: "number",
      description: "Number of cells remaining to reveal",
    },
  },
} as const;

// Error response schema
export const errorResponseSchema = {
  type: "object",
  properties: {
    error: {
      type: "string",
      description: "Error message",
    },
  },
} as const;

// Validation error response schema
export const validationErrorResponseSchema = {
  type: "object",
  properties: {
    error: {
      type: "string",
      description: "Error message",
    },
    details: {
      type: "array",
      items: { type: "string" },
      description: "Detailed validation errors",
    },
  },
} as const;

// Command schema
export const commandSchema = {
  type: "object",
  required: ["command"],
  properties: {
    command: {
      type: "string",
      description: "Command to execute (e.g., 'reveal 3 4', 'flag 2 5')",
      examples: ["reveal 3 4", "flag 2 5", "r 0 1", "f 1 2"],
    },
  },
} as const;

// Command response schema
export const commandResponseSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
      description: "Result message of the command execution",
    },
    gameState: {
      ...gameResponseSchema,
      description: "Updated game state after command execution",
    },
  },
} as const;

// Health check response schema
export const healthResponseSchema = {
  type: "object",
  properties: {
    status: {
      type: "string",
      description: "Health status",
    },
    timestamp: {
      type: "string",
      description: "Current timestamp in ISO format",
    },
    uptime: {
      type: "number",
      description: "Server uptime in seconds",
    },
    version: {
      type: "string",
      description: "Server version",
    },
  },
} as const;

// Games list response schema (admin endpoint)
export const gamesListResponseSchema = {
  type: "object",
  properties: {
    ids: {
      type: "array",
      items: { type: "string" },
      description: "Array of active game IDs",
    },
    total: {
      type: "number",
      description: "Total number of active games",
    },
    message: {
      type: "string",
      description: "Status message",
    },
  },
} as const;

// Unauthorized response schema
export const unauthorizedResponseSchema = {
  type: "object",
  properties: {
    error: {
      type: "string",
      description: "Error type",
    },
    message: {
      type: "string",
      description: "Error message with instructions",
    },
  },
} as const;

// Game ID parameter schema
export const gameIdParamSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      description: "Game ID",
      format: "uuid",
    },
  },
} as const;

// Fastify route schemas for all endpoints
export const routeSchemas = {
  // Health endpoint
  health: {
    operationId: "getHealth",
    tags: ["health"],
    summary: "Health check",
    description: "Check server health and status",
    response: {
      200: healthResponseSchema,
    },
  },

  // Create game endpoint
  createGame: {
    operationId: "createGame",
    tags: ["game"],
    summary: "Create new game",
    description:
      "Create a new Minesweeper game with specified dimensions and bomb percentage",
    body: gameConfigSchema,
    response: {
      201: gameResponseSchema,
      400: validationErrorResponseSchema,
    },
  },

  // Get game state endpoint
  getGameState: {
    operationId: "getGameState",
    tags: ["game"],
    summary: "Get game state",
    description: "Retrieve the current state of a specific game",
    params: gameIdParamSchema,
    response: {
      200: gameResponseSchema,
      404: errorResponseSchema,
    },
  },

  // Reveal cell endpoint
  revealCell: {
    operationId: "revealCell",
    tags: ["game"],
    summary: "Reveal cell",
    description: "Reveal a cell at the specified row and column position",
    params: gameIdParamSchema,
    body: positionSchema,
    response: {
      200: gameResponseSchema,
      400: errorResponseSchema,
      404: errorResponseSchema,
    },
  },

  // Flag cell endpoint
  flagCell: {
    operationId: "flagCell",
    tags: ["game"],
    summary: "Flag cell",
    description: "Flag or unflag a cell at the specified position",
    params: gameIdParamSchema,
    body: positionSchema,
    response: {
      200: gameResponseSchema,
      400: errorResponseSchema,
      404: errorResponseSchema,
    },
  },

  // List games endpoint (admin)
  listGames: {
    operationId: "listGames",
    tags: ["admin"],
    summary: "List all games",
    description: "List all active game sessions (admin only)",
    security: [{ adminKey: [] }],
    response: {
      200: gamesListResponseSchema,
      401: unauthorizedResponseSchema,
    },
  },

  // Execute command endpoint
  executeCommand: {
    operationId: "executeCommand",
    tags: ["game"],
    summary: "Execute command",
    description: "Execute text commands like 'reveal 3 4' or 'flag 2 5'",
    params: gameIdParamSchema,
    body: commandSchema,
    response: {
      200: commandResponseSchema,
      400: errorResponseSchema,
      404: errorResponseSchema,
    },
  },
} as const;
